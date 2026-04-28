import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const SettingsPage = () => {
  const { user } = useAuth();
  const { themePreference, appliedTheme, changeTheme } = useTheme();
  const toast = useToast();

  const handleThemeChange = (theme) => {
    changeTheme(theme);

    toast.success(
      `Theme preference changed to ${theme}.`,
      "Settings updated"
    );
  };

  return (
    <section className="page">
      <div className="section-card page-banner">
        <div>
          <p className="eyebrow">Preferences</p>
          <h2>Settings</h2>
          <p>
            Customize your Courtly AGÜ experience. Theme preferences are saved on
            this device.
          </p>
        </div>

        <div className="banner-metric">
          <span>Theme</span>
          <strong>{appliedTheme}</strong>
        </div>
      </div>

      <div className="two-column settings-layout">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Appearance</p>
              <h2>Theme mode</h2>
            </div>
          </div>

          <div className="theme-option-grid">
            <button
              type="button"
              className={`theme-option-card ${
                themePreference === "light" ? "theme-option-active" : ""
              }`}
              onClick={() => handleThemeChange("light")}
            >
              <span className="theme-icon">☀️</span>
              <strong>Light</strong>
              <small>Clean premium default theme.</small>
            </button>

            <button
              type="button"
              className={`theme-option-card ${
                themePreference === "dark" ? "theme-option-active" : ""
              }`}
              onClick={() => handleThemeChange("dark")}
            >
              <span className="theme-icon">🌙</span>
              <strong>Dark</strong>
              <small>Low-light mode for evening use.</small>
            </button>

            <button
              type="button"
              className={`theme-option-card ${
                themePreference === "system" ? "theme-option-active" : ""
              }`}
              onClick={() => handleThemeChange("system")}
            >
              <span className="theme-icon">💻</span>
              <strong>System</strong>
              <small>Follows your device preference.</small>
            </button>
          </div>

          <p className="helper-text">
            Light mode stays as the default because it currently gives the
            strongest premium product feeling. Dark mode is optional and
            controlled from here.
          </p>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Account</p>
              <h2>Current session</h2>
            </div>
          </div>

          <div className="profile-preview-card">
            <div className="profile-avatar-large small-preview-avatar">
              {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div>
              <h3>{user?.fullName}</h3>
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
              <strong>{user?.tennisLevel}</strong>
            </div>

            <div className="detail-row">
              <span>Racket status</span>
              <strong>{user?.hasRacket ? "Has racket" : "May need racket"}</strong>
            </div>

            <div className="detail-row">
              <span>Theme preference</span>
              <strong>{themePreference}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Future settings</p>
            <h2>Planned preferences</h2>
          </div>
        </div>

        <div className="guidance-grid">
          <div className="guidance-card">
            <span>01</span>
            <h3>Notification preferences</h3>
            <p>
              Reservation reminders, lesson updates and match request alerts can
              be added here later.
            </p>
          </div>

          <div className="guidance-card">
            <span>02</span>
            <h3>Privacy controls</h3>
            <p>
              Users may choose what profile details are visible on match posts.
            </p>
          </div>

          <div className="guidance-card">
            <span>03</span>
            <h3>Equipment preferences</h3>
            <p>
              Racket borrowing, equipment notes and availability rules can be
              added when the club needs them.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;