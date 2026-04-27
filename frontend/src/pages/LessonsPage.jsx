import { useEffect, useState } from "react";
import api from "../api/api";

const LessonsPage = () => {
  const [lessons, setLessons] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const [lessonsRes, applicationsRes] = await Promise.all([
        api.get("/lessons"),
        api.get("/lessons/my-applications")
      ]);

      setLessons(lessonsRes.data.lessons);
      setMyApplications(applicationsRes.data.applications);
    } catch (error) {
      console.log("Lesson load error", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const hasApplied = (lessonId) => {
    return myApplications.some((application) => application.lessonId === lessonId);
  };

  const handleApply = async (lessonId) => {
    try {
      setMessage("");

      await api.post(`/lessons/${lessonId}/apply`, {
        note: "I would like to join this tennis lesson."
      });

      setMessage("Application sent successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Application failed.");
    }
  };

  const formatDate = (dateText) => {
    return new Date(dateText).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Beginner friendly</p>
          <h1>Lessons</h1>
          <p>View tennis lessons and apply for available sessions.</p>
        </div>
      </div>

      {message && <div className="alert">{message}</div>}

      <div className="card-grid">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="section-card">
            <div className="card-top">
              <h2>{lesson.title}</h2>
              <span className="badge">{lesson.level}</span>
            </div>

            <p>{lesson.description}</p>
            <small>{lesson.court.name}</small>
            <small>{formatDate(lesson.startTime)}</small>
            <small>
              Applications: {lesson.applications.length} / {lesson.capacity}
            </small>

            <button
              disabled={hasApplied(lesson.id)}
              onClick={() => handleApply(lesson.id)}
            >
              {hasApplied(lesson.id) ? "Applied" : "Apply"}
            </button>
          </div>
        ))}
      </div>

      <div className="section-card">
        <h2>My lesson applications</h2>

        {myApplications.length === 0 ? (
          <p className="muted">No lesson applications yet.</p>
        ) : (
          <div className="list">
            {myApplications.map((application) => (
              <div key={application.id} className="list-item horizontal">
                <div>
                  <h3>{application.lesson.title}</h3>
                  <p>{application.lesson.court.name}</p>
                </div>
                <span className="badge">{application.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LessonsPage;
