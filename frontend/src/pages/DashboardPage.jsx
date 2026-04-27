import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    courts: 0,
    lessons: 0,
    matches: 0,
    announcements: 0
  });

  const [announcements, setAnnouncements] = useState([]);

  const loadDashboard = async () => {
    try {
      const [courtsRes, lessonsRes, matchesRes, announcementsRes] =
        await Promise.all([
          api.get("/courts"),
          api.get("/lessons"),
          api.get("/matches"),
          api.get("/announcements")
        ]);

      setStats({
        courts: courtsRes.data.courts.length,
        lessons: lessonsRes.data.lessons.length,
        matches: matchesRes.data.matchPosts.length,
        announcements: announcementsRes.data.announcements.length
      });

      setAnnouncements(announcementsRes.data.announcements);
    } catch (error) {
      console.log("Dashboard load error", error);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <section className="page">
      <div className="hero-card">
        <div className="hero-content">
          <p className="eyebrow">Welcome back</p>
          <h2>{user?.fullName}</h2>
          <p>
            Manage your tennis activities, lessons, and matches all in one place.
          </p>

          <div className="hero-actions">
            <Link to="/reservations" className="cta-link primary-link">
              Create reservation
            </Link>
            <Link to="/matches" className="cta-link secondary-link">
              Find a match
            </Link>
          </div>
        </div>

        <div className="hero-aside">
          <div className="hero-mini-card">
            <span className="hero-mini-label">Your level</span>
            <strong>{user?.tennisLevel}</strong>
          </div>
          <div className="hero-mini-card">
            <span className="hero-mini-label">Role</span>
            <strong>{user?.role}</strong>
          </div>
          <div className="hero-mini-card">
            <span className="hero-mini-label">Equipment</span>
            <strong>{user?.hasRacket ? "Racket ready" : "May need racket"}</strong>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Courts</span>
          <strong>{stats.courts}</strong>
          <small>Available court areas in the system</small>
        </div>

        <div className="stat-card">
          <span>Active lessons</span>
          <strong>{stats.lessons}</strong>
          <small>Visible lesson sessions open to students</small>
        </div>

        <div className="stat-card">
          <span>Open matches</span>
          <strong>{stats.matches}</strong>
          <small>Posts created for partner/opponent search</small>
        </div>

        <div className="stat-card">
          <span>Announcements</span>
          <strong>{stats.announcements}</strong>
          <small>Latest updates from admins and organizers</small>
        </div>
      </div>

      <div className="quick-grid">
        <Link to="/courts" className="quick-action-card">
          <div>
            <p className="quick-action-eyebrow">Explore</p>
            <h3>View courts</h3>
            <p>See court status, descriptions and campus availability.</p>
          </div>
          <span>→</span>
        </Link>

        <Link to="/reservations" className="quick-action-card">
          <div>
            <p className="quick-action-eyebrow">Book</p>
            <h3>Reserve a court</h3>
            <p>Create a reservation with a clean and fair experience.</p>
          </div>
          <span>→</span>
        </Link>

        <Link to="/lessons" className="quick-action-card">
          <div>
            <p className="quick-action-eyebrow">Learn</p>
            <h3>Join lessons</h3>
            <p>Track available tennis lessons and send applications.</p>
          </div>
          <span>→</span>
        </Link>

        <Link to="/matches" className="quick-action-card">
          <div>
            <p className="quick-action-eyebrow">Connect</p>
            <h3>Find players</h3>
            <p>Create a match post and meet students at your level.</p>
          </div>
          <span>→</span>
        </Link>
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Updates</p>
            <h2>Latest announcements</h2>
          </div>
        </div>

        {announcements.length === 0 ? (
          <div className="empty-state">
            <h3>No announcements yet</h3>
            <p>Important updates will appear here.</p>
          </div>
        ) : (
          <div className="list">
            {announcements.slice(0, 4).map((announcement) => (
              <div key={announcement.id} className="list-item">
                <h3>{announcement.title}</h3>
                <p>{announcement.content}</p>
                <small>By {announcement.createdBy.fullName}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default DashboardPage;
