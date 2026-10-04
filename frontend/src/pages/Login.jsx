import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();

  const { user, login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          <div className="large-logo" aria-hidden="true">
            <svg viewBox="0 0 32 32" focusable="false">
              <rect x="5" y="7" width="22" height="20" rx="4" />
              <path d="M10 4v6M22 4v6M5 13h22M11 20l3 3 7-7" />
            </svg>
          </div>

          <h1>LeaveTrack</h1>

          <p>
            Simple, smart and efficient
            <br />
            leave management.
          </p>
        </div>

        <div className="login-quote">
          <span aria-hidden="true">{"\u201C"}</span>
          <p>
            Plan. Request. Approve. Done.
            
          </p>
        </div>
      </div>

      <div className="login-form-container">
        <div className="login-form-box">
          <div className="mobile-login-logo">
            <div className="logo-icon">L</div>
            <h2>LeaveTrack</h2>
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

                <Link className="forgot-password" to="/forgot-password">
                  Forgot password?
                </Link>
              </div>

              <div className="password-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="password-visibility-toggle"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    {showPassword ? (
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
              </div>
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
