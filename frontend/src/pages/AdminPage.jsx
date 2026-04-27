import { useEffect, useState } from "react";
import api from "../api/api";

const AdminPage = () => {
  const [courts, setCourts] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState("");

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    level: "BEGINNER",
    courtId: "",
    date: "",
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
      setMessage("");

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

      setMessage("Lesson created successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Lesson creation failed.");
    }
  };

  const handleCreateAnnouncement = async (event) => {
    event.preventDefault();

    try {
      setMessage("");

      await api.post("/announcements", {
        title: announcementForm.title,
        content: announcementForm.content,
        target: "ALL_USERS",
        isPublished: true
      });

      setMessage("Announcement created successfully.");
      setAnnouncementForm({
        title: "",
        content: ""
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Announcement creation failed."
      );
    }
  };

  const loadApplications = async (lessonId) => {
    try {
      const response = await api.get(`/lessons/${lessonId}/applications`);
      setApplications(response.data.applications);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load applications.");
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await api.patch(`/lessons/applications/${applicationId}/status`, {
        status
      });

      setMessage("Application updated successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Update failed.");
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Management</p>
          <h1>Admin Panel</h1>
          <p>Manage lessons, applications and announcements.</p>
        </div>
      </div>

      {message && <div className="alert">{message}</div>}

      <div className="two-column">
        <form onSubmit={handleCreateLesson} className="section-card form">
          <h2>Create lesson</h2>

          <label>Title</label>
          <input
            value={lessonForm.title}
            onChange={(event) => updateLessonField("title", event.target.value)}
          />

          <label>Description</label>
          <textarea
            value={lessonForm.description}
            onChange={(event) =>
              updateLessonField("description", event.target.value)
            }
          />

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

          <label>Court</label>
          <select
            value={lessonForm.courtId}
            onChange={(event) => updateLessonField("courtId", event.target.value)}
          >
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>

          <label>Date</label>
          <input
            type="date"
            value={lessonForm.date}
            onChange={(event) => updateLessonField("date", event.target.value)}
          />

          <label>Start hour</label>
          <input
            type="time"
            value={lessonForm.startHour}
            onChange={(event) =>
              updateLessonField("startHour", event.target.value)
            }
          />

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

          <label>Capacity</label>
          <input
            type="number"
            value={lessonForm.capacity}
            onChange={(event) =>
              updateLessonField("capacity", event.target.value)
            }
          />

          <button type="submit">Create lesson</button>
        </form>

        <form onSubmit={handleCreateAnnouncement} className="section-card form">
          <h2>Create announcement</h2>

          <label>Title</label>
          <input
            value={announcementForm.title}
            onChange={(event) =>
              updateAnnouncementField("title", event.target.value)
            }
          />

          <label>Content</label>
          <textarea
            value={announcementForm.content}
            onChange={(event) =>
              updateAnnouncementField("content", event.target.value)
            }
          />

          <button type="submit">Publish announcement</button>
        </form>
      </div>

      <div className="section-card">
        <h2>Lesson applications</h2>

        <div className="button-row wrap">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              className="secondary-button"
              onClick={() => loadApplications(lesson.id)}
            >
              {lesson.title}
            </button>
          ))}
        </div>

        {applications.length > 0 && (
          <div className="list">
            {applications.map((application) => (
              <div key={application.id} className="list-item horizontal">
                <div>
                  <h3>{application.user.fullName}</h3>
                  <p>
                    {application.user.email} / {application.user.tennisLevel}
                  </p>
                  <small>{application.note}</small>
                </div>

                <div>
                  <span className="badge">{application.status}</span>

                  <div className="button-row">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminPage;
