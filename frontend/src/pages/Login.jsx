import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();

  const { user, login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    if (result.user.role === "ADMIN") {
      navigate("/admin/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="login-page">
      <div className="login-decoration">
        <div className="decoration-circle circle-one"></div>
        <div className="decoration-circle circle-two"></div>

        <div className="login-brand">
          <div className="large-logo">L</div>

          <h1>LeaveFlow</h1>

          <p>
            Simple, smart and efficient
            <br />
            leave management.
          </p>
        </div>

        <div className="login-quote">
          <span>“</span>
          <p>
            Manage your team's time,
            <br />
            effortlessly.
          </p>
        </div>
      </div>

      <div className="login-form-container">
        <div className="login-form-box">
          <div className="mobile-login-logo">
            <div className="logo-icon">L</div>
            <h2>LeaveFlow</h2>
          </div>

          <div className="login-heading">
            <div className="login-eyebrow">
              <span></span>
              SECURE WORKSPACE
            </div>
            <h2>Welcome back</h2>
            <p>Sign in to access your account</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label>Password</label>

                <span className="forgot-password">
                  Forgot password?
                </span>
              </div>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />
            </div>

            <button
              className="primary-button login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="demo-login">
            <p>Demo credentials</p>

            <div>
              <strong>Employee:</strong>
              employee@example.com
            </div>

            <div>
              <strong>Admin:</strong>
              admin@example.com
            </div>

            <small>Password: Password@123</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
