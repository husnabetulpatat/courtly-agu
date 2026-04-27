import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("husna@agu.edu.tr");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const user = await login(email, password);

      if (user.role === "ADMIN" || user.role === "COACH") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-hero">
          <span>🎾</span>
          <h1>AGÜ Tennis Platform</h1>
          <p>
            Reserve courts, join lessons and find tennis partners on campus.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <h2>Login</h2>

          {error && <div className="alert error">{error}</div>}

          <label>Email</label>
          <input
            type="email"
            value={email}
            placeholder="student@agu.edu.tr"
            onChange={(event) => setEmail(event.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            placeholder="123456"
            onChange={(event) => setPassword(event.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="auth-note">
            No account? <Link to="/register">Create one</Link>
          </p>

          <div className="demo-box">
            <strong>Demo accounts</strong>
            <small>Student: husna@agu.edu.tr / 123456</small>
            <small>Admin: admin@agu.edu.tr / 123456</small>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
