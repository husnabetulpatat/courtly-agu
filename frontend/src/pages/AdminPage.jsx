import { useEffect, useState } from "react";
import api from "../api/api";

const getTomorrowDateValue = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

const AdminPage = () => {
  const [courts, setCourts] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [message, setMessage] = useState({
    type: "",
    text: ""
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    level: "BEGINNER",
    courtId: "",
    date: getTomorrowDateValue(),
    startHour: "17:00",
    duration: "60",
    capacity: "8"
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: ""
  });

  const updateLessonField = (field, value) => {
    setLessonForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const updateAnnouncementField = (field, value) => {
    setAnnouncementForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const loadData = async () => {
    try {
      const [courtsRes, lessonsRes] = await Promise.all([
        api.get("/courts"),
        api.get("/lessons")
      ]);

      setCourts(courtsRes.data.courts);
      setLessons(lessonsRes.data.lessons);

      if (!lessonForm.courtId && courtsRes.data.courts.length > 0) {
        updateLessonField("courtId", String(courtsRes.data.courts[0].id));
      }
    } catch (error) {
      console.log("Admin load error", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLesson = async (event) => {
    event.preventDefault();

    try {
      setMessage({
        type: "",
        text: ""
      });

      if (!lessonForm.title.trim() || !lessonForm.date) {
        setMessage({
          type: "error",
          text: "Please enter a lesson title and date."
        });
        return;
      }

      const startTime = new Date(`${lessonForm.date}T${lessonForm.startHour}:00`);
      const endTime = new Date(
        startTime.getTime() + Number(lessonForm.duration) * 60 * 1000
      );

      await api.post("/lessons", {
        title: lessonForm.title,
        description: lessonForm.description,
        level: lessonForm.level,
        courtId: Number(lessonForm.courtId),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        capacity: Number(lessonForm.capacity)
      });

      setMessage({
        type: "success",
        text: "Lesson created successfully."
      });

      setLessonForm((current) => ({
        ...current,
        title: "",
        description: ""
      }));

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Lesson creation failed."
      });
    }
  };

  const handleCreateAnnouncement = async (event) => {
    event.preventDefault();

    try {
      setMessage({
        type: "",
        text: ""
      });

      if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
        setMessage({
          type: "error",
          text: "Please enter announcement title and content."
        });
        return;
      }

      await api.post("/announcements", {
        title: announcementForm.title,
        content: announcementForm.content,
        target: "ALL_USERS",
        isPublished: true
      });

      setMessage({
        type: "success",
        text: "Announcement published successfully."
      });

      setAnnouncementForm({
        title: "",
        content: ""
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Announcement creation failed."
      });
    }
  };

  const loadApplications = async (lesson) => {
    try {
      const response = await api.get(`/lessons/${lesson.id}/applications`);
      setApplications(response.data.applications);
      setSelectedLesson(lesson);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Could not load applications."
      });
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await api.patch(`/lessons/applications/${applicationId}/status`, {
        status
      });

      setMessage({
        type: "success",
        text: `Application marked as ${status.toLowerCase()}.`
      });

      if (selectedLesson) {
        await loadApplications(selectedLesson);
      }

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Update failed."
      });
    }
  };

  const updateCourtStatus = async (courtId, status) => {
    try {
      await api.patch(`/courts/${courtId}`, {
        status
      });

      setMessage({
        type: "success",
        text: "Court status updated successfully."
      });

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Court update failed."
      });
    }
  };

  const getAcceptedCount = (lesson) => {
    return lesson.applications.filter(
      (application) => application.status === "ACCEPTED"
    ).length;
  };

  const formatDate = (dateText) => {
    return new Date(dateText).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  return (
    <section className="page">
      <div className="section-card page-banner">
        <div>
          <p className="eyebrow">Operational control</p>
          <h2>Admin workspace</h2>
          <p>
            Manage lessons, review applications, publish announcements and keep
            court statuses clear for students.
          </p>
        </div>

        <div className="admin-metrics">
          <div className="banner-metric">
            <span>Courts</span>
            <strong>{courts.length}</strong>
          </div>
          <div className="banner-metric">
            <span>Lessons</span>
            <strong>{lessons.length}</strong>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`alert ${message.type === "error" ? "error" : ""}`}>
          {message.text}
        </div>
      )}

      <div className="two-column">
        <form onSubmit={handleCreateLesson} className="section-card form premium-form-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Lessons</p>
              <h2>Create lesson</h2>
            </div>
          </div>

          <label>Title</label>
          <input
            value={lessonForm.title}
            placeholder="Beginner Tennis Lesson"
            onChange={(event) => updateLessonField("title", event.target.value)}
          />

          <label>Description</label>
          <textarea
            value={lessonForm.description}
            placeholder="Short description visible to students..."
            onChange={(event) =>
              updateLessonField("description", event.target.value)
            }
          />

          <div className="inline-form-row">
            <div>
              <label>Level</label>
              <select
                value={lessonForm.level}
                onChange={(event) => updateLessonField("level", event.target.value)}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="BEGINNER_PLUS">Beginner+</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

            <div>
              <label>Court</label>
              <select
                value={lessonForm.courtId}
                onChange={(event) =>
                  updateLessonField("courtId", event.target.value)
                }
              >
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="inline-form-row">
            <div>
              <label>Date</label>
              <input
                type="date"
                min={getTomorrowDateValue()}
                value={lessonForm.date}
                onChange={(event) => updateLessonField("date", event.target.value)}
              />
            </div>

            <div>
              <label>Start hour</label>
              <input
                type="time"
                value={lessonForm.startHour}
                onChange={(event) =>
                  updateLessonField("startHour", event.target.value)
                }
              />
            </div>
          </div>

          <div className="inline-form-row">
            <div>
              <label>Duration</label>
              <select
                value={lessonForm.duration}
                onChange={(event) =>
                  updateLessonField("duration", event.target.value)
                }
              >
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>

            <div>
              <label>Capacity</label>
              <input
                type="number"
                min="1"
                value={lessonForm.capacity}
                onChange={(event) =>
                  updateLessonField("capacity", event.target.value)
                }
              />
            </div>
          </div>

          <p className="helper-text">
            Lessons block the selected court time, so students cannot create
            conflicting reservations.
          </p>

          <button type="submit">Create lesson</button>
        </form>

        <form onSubmit={handleCreateAnnouncement} className="section-card form premium-form-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Communication</p>
              <h2>Publish announcement</h2>
            </div>
          </div>

          <label>Title</label>
          <input
            value={announcementForm.title}
            placeholder="Beginner lessons are open"
            onChange={(event) =>
              updateAnnouncementField("title", event.target.value)
            }
          />

          <label>Content</label>
          <textarea
            value={announcementForm.content}
            placeholder="Write a short and clear announcement for students..."
            onChange={(event) =>
              updateAnnouncementField("content", event.target.value)
            }
          />

          <p className="helper-text">
            Published announcements appear on student dashboards immediately.
          </p>

          <button type="submit">Publish announcement</button>
        </form>
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Facilities</p>
            <h2>Court status management</h2>
          </div>
        </div>

        <div className="card-grid">
          {courts.map((court) => (
            <div key={court.id} className="mini-card">
              <div className="card-top">
                <div>
                  <p className="mini-eyebrow">Court #{court.id}</p>
                  <h3>{court.name}</h3>
                </div>

                <span className={`badge ${court.status.toLowerCase()}`}>
                  {court.status}
                </span>
              </div>

              <p>{court.description}</p>

              <div className="button-row wrap">
                <button
                  className="secondary-button"
                  onClick={() => updateCourtStatus(court.id, "ACTIVE")}
                >
                  Active
                </button>
                <button
                  className="secondary-button"
                  onClick={() => updateCourtStatus(court.id, "MAINTENANCE")}
                >
                  Maintenance
                </button>
                <button
                  className="secondary-button"
                  onClick={() => updateCourtStatus(court.id, "CLOSED")}
                >
                  Closed
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="two-column dashboard-columns">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Lessons</p>
              <h2>Review lesson applications</h2>
            </div>
          </div>

          {lessons.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>No lessons yet</h3>
              <p>Create a lesson first to start collecting applications.</p>
            </div>
          ) : (
            <div className="list">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="list-item">
                  <div className="card-top">
                    <div>
                      <h3>{lesson.title}</h3>
                      <p>{lesson.court.name}</p>
                      <small>{formatDate(lesson.startTime)}</small>
                    </div>

                    <span className="badge">{lesson.level}</span>
                  </div>

                  <div className="details-box">
                    <div className="detail-row">
                      <span>Accepted</span>
                      <strong>
                        {getAcceptedCount(lesson)} / {lesson.capacity}
                      </strong>
                    </div>
                    <div className="detail-row">
                      <span>Total applications</span>
                      <strong>{lesson.applications.length}</strong>
                    </div>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => loadApplications(lesson)}
                  >
                    View applications
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Applications</p>
              <h2>
                {selectedLesson
                  ? selectedLesson.title
                  : "Select a lesson to review"}
              </h2>
            </div>
          </div>

          {!selectedLesson ? (
            <div className="empty-state compact-empty">
              <h3>No lesson selected</h3>
              <p>
                Choose a lesson from the left panel to review student
                applications.
              </p>
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>No applications yet</h3>
              <p>Students who apply to this lesson will appear here.</p>
            </div>
          ) : (
            <div className="list">
              {applications.map((application) => (
                <div key={application.id} className="list-item">
                  <div className="card-top">
                    <div>
                      <h3>{application.user.fullName}</h3>
                      <p>
                        {application.user.email} / {application.user.tennisLevel}
                      </p>
                      <small>
                        {application.user.hasRacket
                          ? "Has racket"
                          : "May need racket"}
                      </small>
                    </div>

                    <span className={`badge ${application.status.toLowerCase()}`}>
                      {application.status}
                    </span>
                  </div>

                  {application.note && (
                    <div className="student-note">
                      “{application.note}”
                    </div>
                  )}

                  <div className="button-row wrap">
                    <button
                      onClick={() =>
                        updateApplicationStatus(application.id, "ACCEPTED")
                      }
                    >
                      Accept
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() =>
                        updateApplicationStatus(application.id, "WAITLISTED")
                      }
                    >
                      Waitlist
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() =>
                        updateApplicationStatus(application.id, "REJECTED")
                      }
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminPage;
