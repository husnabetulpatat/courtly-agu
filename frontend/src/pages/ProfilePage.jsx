import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    tennisLevel: "BEGINNER",
    hasRacket: false,
    bio: ""
  });

  const [message, setMessage] = useState({
    type: "",
    text: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        tennisLevel: user.tennisLevel || "BEGINNER",
        hasRacket: Boolean(user.hasRacket),
        bio: user.bio || ""
      });
    }
  }, [user]);

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setMessage({
        type: "",
        text: ""
      });

      await updateProfile(formData);

      setMessage({
        type: "success",
        text: "Profile updated successfully."
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Profile update failed."
      });
    }
  };

  return (
    <section className="page">
      <div className="section-card page-banner">
        <div>
          <p className="eyebrow">Player identity</p>
          <h2>Your tennis profile</h2>
          <p>
            Keep your level and racket status up to date so lessons, matches and
            future player recommendations can work better for you.
          </p>
        </div>

        <div className="profile-avatar-large">
          {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
        </div>
      </div>

      {message.text && (
        <div className={`alert ${message.type === "error" ? "error" : ""}`}>
          {message.text}
        </div>
      )}

      <div className="two-column profile-layout">
        <form onSubmit={handleSubmit} className="section-card form premium-form-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Edit</p>
              <h2>Profile details</h2>
            </div>
          </div>

          <label>Full name</label>
          <input
            value={formData.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />

          <label>Email</label>
          <input value={user?.email || ""} disabled />

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

          <label>Short player bio</label>
          <textarea
            placeholder="Example: I am new to tennis and looking for beginner-friendly matches."
            value={formData.bio}
            onChange={(event) => updateField("bio", event.target.value)}
          />

          <p className="helper-text">
            This information will help other students understand your level and
            playing preference when match features become more advanced.
          </p>

          <button type="submit">Save profile</button>
        </form>

        <div className="section-card profile-summary-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Summary</p>
              <h2>How others may see you</h2>
            </div>
          </div>

          <div className="profile-preview-card">
            <div className="profile-avatar-large small-preview-avatar">
              {formData.fullName?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div>
              <h3>{formData.fullName || "Your name"}</h3>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="details-box">
            <div className="detail-row">
              <span>Role</span>
              <strong>{user?.role}</strong>
            </div>
            <div className="detail-row">
              <span>Tennis level</span>
              <strong>{formData.tennisLevel}</strong>
            </div>
            <div className="detail-row">
              <span>Racket status</span>
              <strong>
                {formData.hasRacket ? "Has racket" : "May need racket"}
              </strong>
            </div>
          </div>

          <div className="status-panel">
            <span>Bio</span>
            <strong>{formData.bio || "No bio added yet."}</strong>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;