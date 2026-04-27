import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/api";

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [hasRacket, setHasRacket] = useState(Boolean(user?.hasRacket));
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      const response = await api.patch("/auth/profile", {
        hasRacket
      });

      updateUser(response.data.user);

      setMessage({
        type: "success",
        text: "Profile updated successfully."
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile."
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page">
      <div className="section-card page-banner">
        <div>
          <p className="eyebrow">Preferences</p>
          <h2>Settings</h2>
          <p>
            Manage your interface theme and update your tennis profile details.
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`alert ${message.type === "error" ? "error" : ""}`}>
          {message.text}
        </div>
      )}

      <div className="two-column dashboard-columns">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Appearance</p>
              <h2>Interface Theme</h2>
            </div>
          </div>

          <div className="list">
            <div className="list-item horizontal">
              <div>
                <h3>Dark Mode</h3>
                <p>Toggle between light and dark interface.</p>
              </div>

              <div>
                <button
                  className={theme === "dark" ? "segment-active" : "secondary-button"}
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? "Dark Mode Active" : "Enable Dark Mode"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>Tennis Equipment</h2>
            </div>
          </div>

          <div className="form premium-form-card" style={{ gap: '14px' }}>
            <div className="inline-form-row" style={{ gridTemplateColumns: '1fr', gap: '8px' }}>
               <label>Do you have a tennis racket?</label>
               <select
                 value={hasRacket ? "true" : "false"}
                 onChange={(e) => setHasRacket(e.target.value === "true")}
               >
                 <option value="true">Yes, I have a racket</option>
                 <option value="false">No, I need one</option>
               </select>
            </div>

            <p className="helper-text">
              This helps other players know if you can bring a racket to matches.
            </p>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              style={{ alignSelf: "flex-start", marginTop: "10px" }}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
