import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import PageLoader from "../components/PageLoader";
import { useToast } from "../context/ToastContext";

const LessonsPage = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [message, setMessage] = useState({
    type: "",
    text: ""
  });
  const [selectedLevel, setSelectedLevel] = useState("ALL");

  const loadData = async () => {
    try {
      setLoading(true);

      const [lessonsRes, applicationsRes] = await Promise.all([
        api.get("/lessons"),
        api.get("/lessons/my-applications")
      ]);

      setLessons(lessonsRes.data.lessons);
      setMyApplications(applicationsRes.data.applications);
    } catch (error) {
      toast.error("Could not load lessons.");
      console.log("Lesson load error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!message.text) {
      return;
    }

    if (message.type === "error") {
      toast.error(message.text);
    } else {
      toast.success(message.text);
    }
  }, [message, toast]);

  const filteredLessons = useMemo(() => {
    if (selectedLevel === "ALL") {
      return lessons;
    }

    return lessons.filter((lesson) => lesson.level === selectedLevel);
  }, [lessons, selectedLevel]);

  const getApplicationForLesson = (lessonId) => {
    return myApplications.find((application) => application.lessonId === lessonId);
  };

  const getAcceptedCount = (lesson) => {
    return lesson.applications.filter(
      (application) => application.status === "ACCEPTED"
    ).length;
  };

  const getApplicationCount = (lesson) => {
    return lesson.applications.length;
  };

  const getCapacityPercentage = (lesson) => {
    if (!lesson.capacity) {
      return 0;
    }

    return Math.min((getAcceptedCount(lesson) / lesson.capacity) * 100, 100);
  };

  const handleApply = async (lessonId) => {
    try {
      setMessage({
        type: "",
        text: ""
      });

      await api.post(`/lessons/${lessonId}/apply`, {
        note: "I would like to join this tennis lesson."
      });

      setMessage({
        type: "success",
        text: "Application sent successfully. You can track its status below."
      });

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Application failed."
      });
    }
  };

  const formatDate = (dateText) => {
    return new Date(dateText).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  if (loading) {
    return (
      <PageLoader
        title="Loading lessons..."
        text="Available lessons and your applications are being prepared."
      />
    );
  }

  return (
    <section className="page">
      <div className="section-card page-banner">
        <div>
          <p className="eyebrow">Beginner friendly learning</p>
          <h2>Lessons designed for campus tennis</h2>
          <p>
            Explore available tennis lessons, apply with one click and follow
            your application status without losing track of announcements or
            capacity updates.
          </p>
        </div>

        <div className="banner-metric">
          <span>My applications</span>
          <strong>{myApplications.length}</strong>
        </div>
      </div>

      <div className="section-card lesson-toolbar">
        <div>
          <p className="eyebrow">Filter</p>
          <h2>Find the right level</h2>
        </div>

        <div className="segmented-control">
          <button
            className={selectedLevel === "ALL" ? "segment-active" : ""}
            onClick={() => setSelectedLevel("ALL")}
          >
            All
          </button>
          <button
            className={selectedLevel === "BEGINNER" ? "segment-active" : ""}
            onClick={() => setSelectedLevel("BEGINNER")}
          >
            Beginner
          </button>
          <button
            className={selectedLevel === "BEGINNER_PLUS" ? "segment-active" : ""}
            onClick={() => setSelectedLevel("BEGINNER_PLUS")}
          >
            Beginner+
          </button>
          <button
            className={selectedLevel === "INTERMEDIATE" ? "segment-active" : ""}
            onClick={() => setSelectedLevel("INTERMEDIATE")}
          >
            Intermediate
          </button>
          <button
            className={selectedLevel === "ADVANCED" ? "segment-active" : ""}
            onClick={() => setSelectedLevel("ADVANCED")}
          >
            Advanced
          </button>
        </div>
      </div>

      {filteredLessons.length === 0 ? (
        <div className="section-card empty-state">
          <h3>No lessons found</h3>
          <p>
            There are no active lessons for this filter yet. New sessions will
            appear here when admins create them.
          </p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredLessons.map((lesson) => {
            const myApplication = getApplicationForLesson(lesson.id);
            const acceptedCount = getAcceptedCount(lesson);
            const totalApplications = getApplicationCount(lesson);
            const percentage = getCapacityPercentage(lesson);
            const isFull = acceptedCount >= lesson.capacity;

            return (
              <div key={lesson.id} className="section-card premium-card">
                <div className="card-top">
                  <div>
                    <p className="mini-eyebrow">Lesson #{lesson.id}</p>
                    <h2>{lesson.title}</h2>
                  </div>

                  <span className="badge">{lesson.level}</span>
                </div>

                <p className="card-description">{lesson.description}</p>

                <div className="lesson-info-grid">
                  <div>
                    <span>Court</span>
                    <strong>{lesson.court.name}</strong>
                  </div>
                  <div>
                    <span>Date</span>
                    <strong>{formatDate(lesson.startTime)}</strong>
                  </div>
                  <div>
                    <span>Accepted</span>
                    <strong>
                      {acceptedCount} / {lesson.capacity}
                    </strong>
                  </div>
                  <div>
                    <span>Total applications</span>
                    <strong>{totalApplications}</strong>
                  </div>
                </div>

                <div className="capacity-block">
                  <div className="capacity-header">
                    <span>Capacity usage</span>
                    <strong>{Math.round(percentage)}%</strong>
                  </div>
                  <div className="capacity-track">
                    <div
                      className="capacity-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {myApplication ? (
                  <div className="status-panel">
                    <span>Your application status</span>
                    <strong>{myApplication.status}</strong>
                  </div>
                ) : (
                  <button disabled={isFull} onClick={() => handleApply(lesson.id)}>
                    {isFull ? "Lesson full" : "Apply to lesson"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tracking</p>
            <h2>My lesson applications</h2>
          </div>
        </div>

        {myApplications.length === 0 ? (
          <div className="empty-state compact-empty">
            <h3>No applications yet</h3>
            <p>
              When you apply to a lesson, your status will appear here as
              pending, accepted, waitlisted or rejected.
            </p>
          </div>
        ) : (
          <div className="list">
            {myApplications.map((application) => (
              <div key={application.id} className="list-item horizontal">
                <div>
                  <h3>{application.lesson.title}</h3>
                  <p>{application.lesson.court.name}</p>
                  <small>{formatDate(application.lesson.startTime)}</small>
                </div>

                <div className="reservation-meta">
                  <span className={`badge ${application.status.toLowerCase()}`}>
                    {application.status}
                  </span>
                  <small>{application.lesson.level}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LessonsPage;
