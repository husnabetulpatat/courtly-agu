import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      if (!formData.email.trim() || !formData.password.trim()) {
        toast.error("Please enter your email and password.");
        return;
      }

      await login(formData.email, formData.password);

      toast.success("Welcome back to Courtly AGÜ.", "Login successful");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-hero">
          <span>🎾</span>
          <h1>Courtly AGÜ</h1>
          <p>
            Reserve campus courts, join lessons and find tennis partners through
            one clean platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>Login</h2>
          </div>

          <label>Email</label>
          <input
            type="email"
            placeholder="your.name@agu.edu.tr"
            value={formData.email}
            onChange={(event) => updateField("email", event.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Your password"
            value={formData.password}
            onChange={(event) => updateField("password", event.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="auth-note">
            Do not have an account? <Link to="/register">Create one</Link>
          </p>

          <div className="demo-box">
            <strong>Campus access</strong>
            <small>
              Use your AGÜ email address to access the platform.
            </small>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
