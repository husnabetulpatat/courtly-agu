import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const pageMeta = {
  "/": {
    title: "Dashboard",
    subtitle: "Announcements, quick actions and current campus tennis updates."
  },
  "/reservations": {
    title: "Reserve Court",
    subtitle: "Pick a court, choose a day and reserve an available time slot."
  },
  "/lessons": {
    title: "Lessons",
    subtitle: "Join tennis lessons and track your applications."
  },
  "/matches": {
    title: "Matches",
    subtitle: "Find tennis partners at your level and manage partner searches."
  },
  "/courts": {
    title: "Courts",
    subtitle: "Explore available campus courts and their current status."
  },
  "/profile": {
    title: "Profile",
    subtitle: "Manage your tennis level, racket status and player information."
  },
  "/settings": {
    title: "Settings",
    subtitle: "Control appearance and future app preferences."
  },
  "/admin": {
    title: "Admin Panel",
    subtitle: "Manage lessons, applications, courts and announcements."
  }
};

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPage = pageMeta[location.pathname] || {
    title: "Courtly AGÜ",
    subtitle: "A modern court reservation and player matching experience."
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-panel">
          <Link to="/" className="brand">
            <span className="brand-icon">🎾</span>
            <span>
              <strong>Courtly AGÜ</strong>
              <small>Campus tennis platform</small>
            </span>
          </Link>

          <div className="sidebar-section-label">Navigation</div>

          <nav className="nav-links">
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/reservations">Reserve Court</NavLink>
            <NavLink to="/lessons">Lessons</NavLink>
            <NavLink to="/matches">Matches</NavLink>
            <NavLink to="/courts">Courts</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            <NavLink to="/settings">Settings</NavLink>
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          </nav>

          <div className="sidebar-note">
            <p className="sidebar-note-title">Fair court usage</p>
            <small>
              Reserve courts, join lessons and connect with players at your level.
            </small>
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-footer-info">
              <div className="user-avatar compact-avatar">
                {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div>
                <p>{user?.fullName}</p>
                <small>{user?.role}</small>
              </div>
            </div>

            <button className="sidebar-logout-mini" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Courtly AGÜ</p>
            <h1>{currentPage.title}</h1>
            <p className="topbar-subtitle">{currentPage.subtitle}</p>
          </div>
        </header>

        <main className="content-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;