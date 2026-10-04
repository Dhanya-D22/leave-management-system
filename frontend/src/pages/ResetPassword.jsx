import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password,
      });
      setMessage(response.data.message);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to reset your password. Please request a new link."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="password-reset-page">
      <section className="password-reset-card">
        <div className="login-heading">
          <div className="login-eyebrow">
            <span></span>
            ACCOUNT RECOVERY
          </div>
          <h2>Set a new password</h2>
          <p>Choose a password with at least 8 characters.</p>
        </div>

        {message && (
          <div className="success-message" role="status">
            {message}
          </div>
        )}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="new-password">New password</label>
              <div className="password-input-wrap">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <PasswordVisibilityToggle visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm new password</label>
              <div className="password-input-wrap">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                <PasswordVisibilityToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((visible) => !visible)} />
              </div>
            </div>
            <button
              className="primary-button login-button"
              type="submit"
              disabled={submitting || !token}
            >
              {submitting ? "Updating..." : "Reset password"}
            </button>
            {!token && (
              <div className="error-message" role="alert">
                This reset link is missing its token. Request a new link.
              </div>
            )}
          </form>
        )}

        <Link className="auth-back-link" to="/login">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}

function PasswordVisibilityToggle({ visible, onToggle }) {
  return (
    <button
      className="password-visibility-toggle"
      type="button"
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      onClick={onToggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {visible ? (
          <>
            <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.7 4.2 10 7-.4.9-1.2 2-2.4 3.1M6.2 6.2C3.9 7.8 2.5 10 2 12c1.3 2.8 5 7 10 7 1 0 2-.2 2.9-.5" />
          </>
        ) : (
          <>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  );
}

export default ResetPassword;
