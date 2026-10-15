import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { changePassword } from "../../services/authService";
import { getUser, homePathFor, logout, saveSession } from "../../utils/auth";

const emptyForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function ChangePassword() {
  const navigate = useNavigate();

  const user = getUser();

  // True when the Director created or reset this account's password
  const forced = Boolean(user?.mustChangePassword);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (form.newPassword.length < 8) {
      setError("The new password must contain at least 8 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("The two new passwords do not match.");
      return;
    }

    if (form.newPassword === form.currentPassword) {
      setError("The new password must be different from the current one.");
      return;
    }

    try {
      setSaving(true);

      const result = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      // Older sessions stop working, so keep this one logged in
      saveSession(result.token, result.user);

      navigate(homePathFor(result.user.role), { replace: true });
    } catch (err) {
      setError(err.message || "Unable to change your password.");
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          ViaVistas WorkHub
        </p>

        <h1 className="mt-3 text-2xl font-extrabold text-[#111111]">
          {forced ? "Set your new password" : "Change password"}
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          {forced
            ? "Your account uses a temporary password. Choose your own to continue."
            : "Choose a new password for your account."}
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={handleChange}
            placeholder={
              forced ? "Temporary password" : "Current password"
            }
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
          />

          <input
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="New password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
          />

          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
            className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
          />

          <p className="text-xs text-neutral-500">
            Use at least 8 characters. Avoid your name or email, and use a
            password you do not use anywhere else.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="h-12 w-full rounded-xl bg-[#111111] text-sm font-bold text-white hover:bg-[#242424] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Change password"}
          </button>
        </form>

        <div className="mt-5 text-center">
          {forced ? (
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-neutral-500 underline hover:text-black"
            >
              Log out
            </button>
          ) : (
            <button
              onClick={() => navigate(homePathFor(user?.role))}
              className="text-sm font-semibold text-neutral-500 underline hover:text-black"
            >
              Back to dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;