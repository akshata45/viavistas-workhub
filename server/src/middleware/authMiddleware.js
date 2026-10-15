import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

// Checks the login token and the person's current state in the database.
// allowTemporaryPassword: true only for the "change password" route, so a
// person with a temporary password can still reach it (and nothing else).
const checkLogin = (allowTemporaryPassword) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);

    // Always check the latest state from the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        teamId: true,
        isActive: true,
        mustChangePassword: true,
        passwordChangedAt: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive or no longer exists.",
      });
    }

    // Changing a password signs out every older session
    if (
      user.passwordChangedAt &&
      decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      return res.status(401).json({
        success: false,
        message: "Your password was changed. Please log in again.",
      });
    }

    // A temporary password only allows choosing a new one
    if (user.mustChangePassword && !allowTemporaryPassword) {
      return res.status(403).json({
        success: false,
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "You must set a new password before continuing.",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// Used by every normal route
export const authenticate = checkLogin(false);

// Used only by the change-password route
export const authenticateAllowingTemporaryPassword = checkLogin(true);