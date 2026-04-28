import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

const DashboardPage = () => {
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
      <div className="dashboard-main-grid">
        <div className="section-card announcement-focus-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Campus updates</p>
              <h2>Latest announcements</h2>
            </div>

            <span className="soft-pill">{stats.announcements} updates</span>
          </div>

          {announcements.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>No announcements yet</h3>
              <p>
                Important updates about lessons, court availability and campus
                tennis events will appear here.
              </p>
            </div>
          ) : (
            <div className="announcement-list">
              {announcements.slice(0, 5).map((announcement) => (
                <div key={announcement.id} className="announcement-item">
                  <div>
                    <p className="mini-eyebrow">Announcement</p>
                    <h3>{announcement.title}</h3>
                    <p>{announcement.content}</p>
                    <small>By {announcement.createdBy.fullName}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-card dashboard-side-card">
          <p className="eyebrow">System overview</p>
          <h2>Today at a glance</h2>

          <div className="dashboard-stat-list">
            <div>
              <span>Courts</span>
              <strong>{stats.courts}</strong>
            </div>
            <div>
              <span>Active lessons</span>
              <strong>{stats.lessons}</strong>
            </div>
            <div>
              <span>Open matches</span>
              <strong>{stats.matches}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">What would you like to do?</p>
            <h2>Quick actions</h2>
          </div>
        </div>

        <div className="quick-grid improved-quick-grid">
          <Link to="/courts" className="quick-action-card">
            <div>
              <p className="quick-action-eyebrow">Explore</p>
              <h3>View courts</h3>
              <p>Check court status before planning your session.</p>
            </div>
            <span>→</span>
          </Link>

          <Link to="/reservations" className="quick-action-card">
            <div>
              <p className="quick-action-eyebrow">Book</p>
              <h3>Reserve a court</h3>
              <p>Select a court, day and available slot in a guided flow.</p>
            </div>
            <span>→</span>
          </Link>

          <Link to="/lessons" className="quick-action-card">
            <div>
              <p className="quick-action-eyebrow">Learn</p>
              <h3>Join lessons</h3>
              <p>Apply to beginner-friendly sessions and track your status.</p>
            </div>
            <span>→</span>
          </Link>

          <Link to="/matches" className="quick-action-card">
            <div>
              <p className="quick-action-eyebrow">Connect</p>
              <h3>Find players</h3>
              <p>Create or join match posts with students at your level.</p>
            </div>
            <span>→</span>
          </Link>
        </div>
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Suggested path</p>
            <h2>New to campus tennis?</h2>
          </div>
        </div>

        <div className="guidance-grid">
          <div className="guidance-card">
            <span>01</span>
            <h3>Start with lessons</h3>
            <p>
              If you are new to tennis, check active lessons first and apply to
              the level that fits you.
            </p>
          </div>

          <div className="guidance-card">
            <span>02</span>
            <h3>Reserve with intention</h3>
            <p>
              Use reservations when you already have a partner or a clear
              practice plan.
            </p>
          </div>

          <div className="guidance-card">
            <span>03</span>
            <h3>Use matches socially</h3>
            <p>
              If you do not know anyone yet, match posts help you find students
              at a similar level.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;