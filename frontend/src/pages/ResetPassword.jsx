import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
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

export default ResetPassword;
