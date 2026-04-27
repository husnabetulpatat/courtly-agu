import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const pageMeta = {
  "/": {
    title: "Dashboard",
    subtitle: "Your campus tennis activity, lessons and matches in one place."
  },
  "/courts": {
    title: "Courts",
    subtitle: "Explore available campus courts and their current status."
  },
  "/reservations": {
    title: "Reserve a Court",
    subtitle: "Reserve courts with a clean, fair and transparent flow."
  },
  "/my-reservations": {
    title: "My Reservations",
    subtitle: "View and manage your upcoming tennis sessions."
  },
  "/lessons": {
    title: "Lessons",
    subtitle: "Join tennis lessons and track your applications."
  },
  "/matches": {
    title: "Matches",
    subtitle: "Find tennis partners at your level and create match posts."
  },
  "/admin": {
    title: "Admin Panel",
    subtitle: "Manage lessons, applications and announcements."
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage your theme and profile preferences."
  }
};

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPage = pageMeta[location.pathname] || {
    title: "AGÜ Tennis",
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
            <NavLink to="/courts">Courts</NavLink>
            <NavLink to="/reservations">Reserve Court</NavLink>
            <NavLink to="/my-reservations">My Reservations</NavLink>
            <NavLink to="/lessons">Lessons</NavLink>
            <NavLink to="/matches">Matches</NavLink>
            <NavLink to="/settings">Settings</NavLink>
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          </nav>



          <div className="sidebar-user">
            <div className="user-card">
              <div className="user-avatar">
                {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div>
                <p>{user?.fullName}</p>
                <small>{user?.email}</small>
              </div>
            </div>

            <div className="user-tags">
              <span className="soft-pill">{user?.role}</span>
              <span className="soft-pill">{user?.tennisLevel}</span>
              {user?.hasRacket ? (
                <span className="soft-pill">Has racket</span>
              ) : (
                <span className="soft-pill muted-pill">Needs racket</span>
              )}
            </div>

            <button className="logout-button" onClick={handleLogout}>
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

          <div className="topbar-right">
            <div className="topbar-card">
              <span className="topbar-card-label">Current profile</span>
              <strong>{user?.tennisLevel}</strong>
              <small>{user?.role}</small>
            </div>
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
