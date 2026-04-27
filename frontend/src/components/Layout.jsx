import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-icon">🎾</span>
          <span>
            <strong>AGÜ Tennis</strong>
            <small>Court & Match</small>
          </span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/courts">Courts</NavLink>
          <NavLink to="/reservations">Reservations</NavLink>
          <NavLink to="/lessons">Lessons</NavLink>
          <NavLink to="/matches">Matches</NavLink>
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className="sidebar-user">
          <p>{user?.fullName}</p>
          <small>{user?.role}</small>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
