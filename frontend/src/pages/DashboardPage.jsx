import { useEffect, useState } from "react";
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
      <div className="page-header">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>{user?.fullName}</h1>
          <p>
            Manage your court reservations, lessons and tennis matches from one
            place.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Courts</span>
          <strong>{stats.courts}</strong>
        </div>
        <div className="stat-card">
          <span>Active Lessons</span>
          <strong>{stats.lessons}</strong>
        </div>
        <div className="stat-card">
          <span>Open Matches</span>
          <strong>{stats.matches}</strong>
        </div>
        <div className="stat-card">
          <span>Announcements</span>
          <strong>{stats.announcements}</strong>
        </div>
      </div>

      <div className="section-card">
        <h2>Latest announcements</h2>

        {announcements.length === 0 ? (
          <p className="muted">No announcements yet.</p>
        ) : (
          <div className="list">
            {announcements.map((announcement) => (
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
