import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);

    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(response.data.message);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to request a password reset. Please try again."
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
          <h2>Forgot password?</h2>
          <p>Enter your account email and we’ll send a reset link.</p>
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reset-email">Email address</label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <button
            className="primary-button login-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <Link className="auth-back-link" to="/login">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}

export default ForgotPassword;
