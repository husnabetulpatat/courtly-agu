import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    tennisLevel: "BEGINNER",
    hasRacket: false,
    bio: ""
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

      if (
        !formData.fullName.trim() ||
        !formData.email.trim() ||
        !formData.password.trim()
      ) {
        toast.error("Please fill in your name, email and password.");
        return;
      }

      await register(formData);

      toast.success(
        "Your account has been created successfully.",
        "Welcome to Courtly AGÜ"
      );

      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-hero">
          <span>🎾</span>
          <h1>Join Courtly AGÜ</h1>
          <p>
            Create your tennis profile, track your racket status and start using
            campus courts more fairly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div>
            <p className="eyebrow">Create account</p>
            <h2>Register</h2>
          </div>

          <label>Full name</label>
          <input
            placeholder="Your full name"
            value={formData.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />

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
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={(event) => updateField("password", event.target.value)}
          />

          <label>Tennis level</label>
          <select
            value={formData.tennisLevel}
            onChange={(event) => updateField("tennisLevel", event.target.value)}
          >
            <option value="BEGINNER">Beginner</option>
            <option value="BEGINNER_PLUS">Beginner+</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>

          <label className="checkbox-row premium-checkbox-row">
            <input
              type="checkbox"
              checked={formData.hasRacket}
              onChange={(event) => updateField("hasRacket", event.target.checked)}
            />
            I have a tennis racket
          </label>

          <label>Short bio</label>
          <textarea
            placeholder="Example: I am new to tennis and looking for beginner-friendly sessions."
            value={formData.bio}
            onChange={(event) => updateField("bio", event.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="auth-note">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
