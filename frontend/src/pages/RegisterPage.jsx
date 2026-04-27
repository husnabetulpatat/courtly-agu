import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    tennisLevel: "BEGINNER",
    hasRacket: false,
    bio: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setError("");

      await register(formData);
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-hero">
          <span>🎾</span>
          <h1>Join AGÜ Tennis</h1>
          <p>Create your student profile and start playing.</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <h2>Register</h2>

          {error && <div className="alert error">{error}</div>}

          <label>Full name</label>
          <input
            value={formData.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />

          <label>AGÜ email</label>
          <input
            type="email"
            placeholder="name@agu.edu.tr"
            value={formData.email}
            onChange={(event) => updateField("email", event.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
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

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={formData.hasRacket}
              onChange={(event) => updateField("hasRacket", event.target.checked)}
            />
            I have a racket
          </label>

          <label>Short bio</label>
          <textarea
            value={formData.bio}
            onChange={(event) => updateField("bio", event.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
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
