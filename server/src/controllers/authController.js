import prisma from "../config/prisma.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { createFailureLimiter } from "../utils/failureLimiter.js";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// 5 wrong passwords for one email from one place
const accountLimiter = createFailureLimiter({
  maxFailures: 5,
  windowMs: WINDOW_MS,
});

// 30 failures from one place in total (guessing across many emails)
const ipLimiter = createFailureLimiter({
  maxFailures: 30,
  windowMs: WINDOW_MS,
});

// 5 wrong "current passwords" on the change-password screen
const changeLimiter = createFailureLimiter({
  maxFailures: 5,
  windowMs: WINDOW_MS,
});

// A real hash to compare against when the email does not exist, so
// rejecting an unknown email takes as long as rejecting a wrong password.
const DUMMY_HASH = await hashPassword("not-a-real-password");

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  profilePhoto: user.profilePhoto,
  mustChangePassword: user.mustChangePassword,
});

const tooManyAttempts = (res, seconds) => {
  res.set("Retry-After", String(seconds));

  return res.status(429).json({
    success: false,
    message: `Too many failed attempts. Please try again in ${Math.ceil(
      seconds / 60
    )} minute(s).`,
  });
};

export const login = async (req, res) => {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const ip = req.ip || "unknown";
    const accountKey = `${ip}|${email}`;

    const wait = Math.max(
      ipLimiter.retryAfter(ip),
      accountLimiter.retryAfter(accountKey)
    );

    if (wait > 0) {
      return tooManyAttempts(res, wait);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always run one password check, so the time taken
    // does not reveal whether the email exists.
    const passwordValid = await comparePassword(
      password,
      user ? user.password : DUMMY_HASH
    );

    if (!user || !passwordValid) {
      accountLimiter.fail(accountKey);
      ipLimiter.fail(ip);

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Only someone who knows the password learns the account is inactive
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    accountLimiter.reset(accountKey);

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in.",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please enter your current and new password.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "The new password must contain at least 8 characters.",
      });
    }

    if (newPassword.length > 72) {
      return res.status(400).json({
        success: false,
        message: "The new password is too long (max 72 characters).",
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message: "The new password must be different from the current one.",
      });
    }

    if (newPassword.toLowerCase() === String(req.user.email).toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "The password cannot be your email address.",
      });
    }

    const key = `user:${req.user.id}`;
    const wait = changeLimiter.retryAfter(key);

    if (wait > 0) {
      return tooManyAttempts(res, wait);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Your account no longer exists.",
      });
    }

    const currentValid = await comparePassword(currentPassword, user.password);

    if (!currentValid) {
      changeLimiter.fail(key);

      return res.status(400).json({
        success: false,
        message: "Your current password is incorrect.",
      });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(newPassword),
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePhoto: true,
        mustChangePassword: true,
      },
    });

    changeLimiter.reset(key);

    // Older sessions stop working now, so this one gets a fresh token
    const token = generateToken(updated);

    return res.status(200).json({
      success: true,
      message: "Your password was changed.",
      token,
      user: publicUser(updated),
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change your password.",
    });
  }
};