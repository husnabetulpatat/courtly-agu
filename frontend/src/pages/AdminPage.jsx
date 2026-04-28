import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

const getTomorrowDateValue = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const [courts, setCourts] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [applications, setApplications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tournamentMatches, setTournamentMatches] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [reservationFilter, setReservationFilter] = useState("UPCOMING");

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

  const [tournamentForm, setTournamentForm] = useState({
    title: "",
    playerOneName: "",
    playerTwoName: "",
    courtId: "",
    date: getTomorrowDateValue(),
    startHour: "17:00",
    duration: "60",
    note: ""
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

  const updateTournamentField = (field, value) => {
    setTournamentForm((current) => ({
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
      const [courtsRes, lessonsRes, announcementsRes, reservationsRes, tournamentRes] =
        await Promise.all([
          api.get("/courts"),
          api.get("/lessons"),
          api.get("/announcements/admin/all"),
          api.get("/reservations"),
          api.get("/tournaments")
        ]);

      setCourts(courtsRes.data.courts);
      setLessons(lessonsRes.data.lessons);
      setAnnouncements(announcementsRes.data.announcements);
      setReservations(reservationsRes.data.reservations);
      setTournamentMatches(tournamentRes.data.matches);

      if (!lessonForm.courtId && courtsRes.data.courts.length > 0) {
        updateLessonField("courtId", String(courtsRes.data.courts[0].id));
      }

      if (!tournamentForm.courtId && courtsRes.data.courts.length > 0) {
        updateTournamentField("courtId", String(courtsRes.data.courts[0].id));
      }
    } catch (error) {
      console.log("Admin load error", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const reservationGroups = useMemo(() => {
    const now = new Date();

    const upcoming = reservations.filter((reservation) => {
      return (
        reservation.status !== "CANCELLED" &&
        new Date(reservation.endTime) >= now
      );
    });

    const past = reservations.filter((reservation) => {
      return (
        reservation.status !== "CANCELLED" &&
        new Date(reservation.endTime) < now
      );
    });

    const cancelled = reservations.filter((reservation) => {
      return reservation.status === "CANCELLED";
    });

    return {
      upcoming,
      past,
      cancelled,
      all: reservations
    };
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    if (reservationFilter === "UPCOMING") {
      return reservationGroups.upcoming;
    }

    if (reservationFilter === "PAST") {
      return reservationGroups.past;
    }

    if (reservationFilter === "CANCELLED") {
      return reservationGroups.cancelled;
    }

    return reservationGroups.all;
  }, [reservationFilter, reservationGroups]);

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

  const handleDeleteLesson = async (lessonId) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this lesson? Applications connected to this lesson will also be deleted."
      );

      if (!confirmed) {
        return;
      }

      await api.delete(`/lessons/${lessonId}`);

      setMessage({
        type: "success",
        text: "Lesson deleted successfully."
      });

      setApplications([]);
      setSelectedLesson(null);
      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Lesson deletion failed."
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

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Announcement creation failed."
      });
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this announcement?"
      );

      if (!confirmed) {
        return;
      }

      await api.delete(`/announcements/${announcementId}`);

      setMessage({
        type: "success",
        text: "Announcement deleted successfully."
      });

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Announcement deletion failed."
      });
    }
  };

  const loadApplications = async (lesson) => {
    try {
      const response = await api.get(`/lessons/${lesson.id}/applications`);
      setApplications(response.data.applications);
      setSelectedLesson(lesson);
      setActiveTab("applications");
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

  const updateReservationStatus = async (reservationId, status) => {
    try {
      await api.patch(`/reservations/${reservationId}/status`, {
        status
      });

      setMessage({
        type: "success",
        text: `Reservation marked as ${status.toLowerCase()}.`
      });

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Reservation update failed."
      });
    }
  };

  const handleCreateTournamentMatch = async (event) => {
    event.preventDefault();

    try {
      setMessage({
        type: "",
        text: ""
      });

      if (
        !tournamentForm.playerOneName.trim() ||
        !tournamentForm.playerTwoName.trim() ||
        !tournamentForm.date
      ) {
        setMessage({
          type: "error",
          text: "Please enter both player names and match date."
        });
        return;
      }

      const startTime = new Date(
        `${tournamentForm.date}T${tournamentForm.startHour}:00`
      );

      const endTime = new Date(
        startTime.getTime() + Number(tournamentForm.duration) * 60 * 1000
      );

      await api.post("/tournaments", {
        title: tournamentForm.title,
        playerOneName: tournamentForm.playerOneName,
        playerTwoName: tournamentForm.playerTwoName,
        courtId: Number(tournamentForm.courtId),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        note: tournamentForm.note
      });

      setMessage({
        type: "success",
        text: "Tournament match created successfully."
      });

      setTournamentForm((current) => ({
        ...current,
        title: "",
        playerOneName: "",
        playerTwoName: "",
        note: ""
      }));

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Tournament match creation failed."
      });
    }
  };

  const updateTournamentMatchStatus = async (matchId, status) => {
    try {
      await api.patch(`/tournaments/${matchId}`, {
        status
      });

      setMessage({
        type: "success",
        text: `Tournament match marked as ${status.toLowerCase()}.`
      });

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Tournament update failed."
      });
    }
  };

  const updateTournamentScore = async (matchId, score, winnerName) => {
    try {
      await api.patch(`/tournaments/${matchId}`, {
        score,
        winnerName,
        status: "COMPLETED"
      });

      setMessage({
        type: "success",
        text: "Tournament result updated successfully."
      });

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Score update failed."
      });
    }
  };

  const handleDeleteTournamentMatch = async (matchId) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this tournament match?"
      );

      if (!confirmed) {
        return;
      }

      await api.delete(`/tournaments/${matchId}`);

      setMessage({
        type: "success",
        text: "Tournament match deleted successfully."
      });

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Tournament deletion failed."
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

  const renderReservationCard = (reservation) => {
    const acceptedRequest = reservation.matchPost?.requests?.find(
      (request) => request.status === "ACCEPTED"
    );

    return (
      <div key={reservation.id} className="list-item admin-reservation-card">
        <div className="card-top">
          <div>
            <h3>{reservation.court.name}</h3>
            <p>{reservation.user.fullName}</p>
            <small>{reservation.user.email}</small>
          </div>

          <span className={`badge ${reservation.status.toLowerCase()}`}>
            {reservation.status}
          </span>
        </div>

        <div className="details-box">
          <div className="detail-row">
            <span>Time</span>
            <strong>{formatDate(reservation.startTime)}</strong>
          </div>

          <div className="detail-row">
            <span>Type</span>
            <strong>{reservation.type}</strong>
          </div>

          <div className="detail-row">
            <span>Player level</span>
            <strong>{reservation.user.tennisLevel}</strong>
          </div>

          <div className="detail-row">
            <span>Racket</span>
            <strong>
              {reservation.user.hasRacket ? "Has racket" : "May need racket"}
            </strong>
          </div>
        </div>

        {reservation.note && (
          <div className="student-note">“{reservation.note}”</div>
        )}

        {reservation.matchPost && (
          <div className="linked-match-card">
            <span>Linked partner search</span>
            <strong>{reservation.matchPost.title}</strong>
            <small>Status: {reservation.matchPost.status}</small>

            {acceptedRequest && (
              <small>Matched with: {acceptedRequest.requester.fullName}</small>
            )}
          </div>
        )}

        <div className="admin-status-actions">
          <button
            className="secondary-button"
            onClick={() => updateReservationStatus(reservation.id, "CONFIRMED")}
          >
            Confirm
          </button>

          <button
            className="secondary-button"
            onClick={() => updateReservationStatus(reservation.id, "COMPLETED")}
          >
            Completed
          </button>

          <button
            className="secondary-button"
            onClick={() => updateReservationStatus(reservation.id, "NO_SHOW")}
          >
            No-show
          </button>

          <button
            className="danger-button"
            onClick={() => updateReservationStatus(reservation.id, "CANCELLED")}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="page">
      <div className="section-card page-banner">
        <div>
          <p className="eyebrow">Operational control</p>
          <h2>Admin workspace</h2>
          <p>
            Choose what you want to manage first, then work inside a focused
            admin section.
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
          <div className="banner-metric">
            <span>Reservations</span>
            <strong>{reservations.length}</strong>
          </div>
          <div className="banner-metric">
            <span>Tournament</span>
            <strong>{tournamentMatches.length}</strong>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`alert ${message.type === "error" ? "error" : ""}`}>
          {message.text}
        </div>
      )}

      <div className="section-card admin-tab-card">
        <button
          className={activeTab === "overview" ? "admin-tab-active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={activeTab === "reservations" ? "admin-tab-active" : ""}
          onClick={() => setActiveTab("reservations")}
        >
          Reservations
        </button>
        <button
          className={activeTab === "lessons" ? "admin-tab-active" : ""}
          onClick={() => setActiveTab("lessons")}
        >
          Lessons
        </button>
        <button
          className={activeTab === "applications" ? "admin-tab-active" : ""}
          onClick={() => setActiveTab("applications")}
        >
          Applications
        </button>
        <button
          className={activeTab === "announcements" ? "admin-tab-active" : ""}
          onClick={() => setActiveTab("announcements")}
        >
          Announcements
        </button>
        <button
          className={activeTab === "courts" ? "admin-tab-active" : ""}
          onClick={() => setActiveTab("courts")}
        >
          Courts
        </button>
        <button
          className={activeTab === "tournament" ? "admin-tab-active" : ""}
          onClick={() => setActiveTab("tournament")}
        >
          Tournament
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="guidance-grid">
          <button
            className="admin-action-card"
            onClick={() => setActiveTab("reservations")}
          >
            <span>01</span>
            <h3>Manage reservations</h3>
            <p>Review bookings and mark them as completed, no-show or cancelled.</p>
          </button>

          <button
            className="admin-action-card"
            onClick={() => setActiveTab("lessons")}
          >
            <span>02</span>
            <h3>Manage lessons</h3>
            <p>Create new tennis lessons or delete existing sessions.</p>
          </button>

          <button
            className="admin-action-card"
            onClick={() => setActiveTab("applications")}
          >
            <span>03</span>
            <h3>Review applications</h3>
            <p>Accept, waitlist or reject student lesson applications.</p>
          </button>

          <button
            className="admin-action-card"
            onClick={() => setActiveTab("announcements")}
          >
            <span>04</span>
            <h3>Manage announcements</h3>
            <p>Publish important updates or delete old announcements.</p>
          </button>

          <button
            className="admin-action-card"
            onClick={() => setActiveTab("courts")}
          >
            <span>05</span>
            <h3>Manage courts</h3>
            <p>Set court status as active, maintenance or closed.</p>
          </button>

          <button
            className="admin-action-card"
            onClick={() => setActiveTab("tournament")}
          >
            <span>06</span>
            <h3>Manage tournament</h3>
            <p>Create tournament matches, update results and manage schedule.</p>
          </button>
        </div>
      )}

      {activeTab === "reservations" && (
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Bookings</p>
              <h2>Reservation management</h2>
            </div>

            <button className="secondary-button" onClick={loadData}>
              Refresh
            </button>
          </div>

          <div className="reservation-admin-toolbar">
            <button
              className={reservationFilter === "UPCOMING" ? "admin-tab-active" : ""}
              onClick={() => setReservationFilter("UPCOMING")}
            >
              Upcoming ({reservationGroups.upcoming.length})
            </button>

            <button
              className={reservationFilter === "PAST" ? "admin-tab-active" : ""}
              onClick={() => setReservationFilter("PAST")}
            >
              Past ({reservationGroups.past.length})
            </button>

            <button
              className={
                reservationFilter === "CANCELLED" ? "admin-tab-active" : ""
              }
              onClick={() => setReservationFilter("CANCELLED")}
            >
              Cancelled ({reservationGroups.cancelled.length})
            </button>

            <button
              className={reservationFilter === "ALL" ? "admin-tab-active" : ""}
              onClick={() => setReservationFilter("ALL")}
            >
              All ({reservationGroups.all.length})
            </button>
          </div>

          {filteredReservations.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>No reservations found</h3>
              <p>Reservations for this filter will appear here.</p>
            </div>
          ) : (
            <div className="admin-reservation-grid">
              {filteredReservations.map((reservation) =>
                renderReservationCard(reservation)
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "lessons" && (
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

          <div className="section-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Existing</p>
                <h2>Created lessons</h2>
              </div>
            </div>

            {lessons.length === 0 ? (
              <div className="empty-state compact-empty">
                <h3>No lessons yet</h3>
                <p>Create a lesson first.</p>
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

                    <div className="button-row wrap">
                      <button
                        className="secondary-button"
                        onClick={() => loadApplications(lesson)}
                      >
                        View applications
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => handleDeleteLesson(lesson.id)}
                      >
                        Delete lesson
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "applications" && (
        <div className="two-column dashboard-columns">
          <div className="section-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Lessons</p>
                <h2>Select lesson</h2>
              </div>
            </div>

            {lessons.length === 0 ? (
              <div className="empty-state compact-empty">
                <h3>No lessons yet</h3>
                <p>Create a lesson first to review applications.</p>
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

                      <span className="badge">{lesson.applications.length}</span>
                    </div>

                    <button
                      className="secondary-button"
                      onClick={() => loadApplications(lesson)}
                    >
                      Review applications
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
                <p>Choose a lesson from the left panel.</p>
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
                      <div className="student-note">“{application.note}”</div>
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
      )}

      {activeTab === "announcements" && (
        <div className="two-column">
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

          <div className="section-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Existing</p>
                <h2>Announcements</h2>
              </div>
            </div>

            {announcements.length === 0 ? (
              <div className="empty-state compact-empty">
                <h3>No announcements yet</h3>
                <p>Create your first announcement.</p>
              </div>
            ) : (
              <div className="list">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="list-item">
                    <div className="card-top">
                      <div>
                        <h3>{announcement.title}</h3>
                        <p>{announcement.content}</p>
                        <small>By {announcement.createdBy.fullName}</small>
                      </div>

                      <span
                        className={`badge ${
                          announcement.isPublished ? "confirmed" : "pending"
                        }`}
                      >
                        {announcement.isPublished ? "PUBLISHED" : "DRAFT"}
                      </span>
                    </div>

                    <button
                      className="danger-button"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                    >
                      Delete announcement
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "courts" && (
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
      )}

      {activeTab === "tournament" && (
        <div className="two-column">
          <form
            onSubmit={handleCreateTournamentMatch}
            className="section-card form premium-form-card"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Tournament</p>
                <h2>Create tournament match</h2>
              </div>
            </div>

            <label>Title</label>
            <input
              value={tournamentForm.title}
              placeholder="Quarter Final Match"
              onChange={(event) =>
                updateTournamentField("title", event.target.value)
              }
            />

            <label>Player 1</label>
            <input
              value={tournamentForm.playerOneName}
              placeholder="Player one name"
              onChange={(event) =>
                updateTournamentField("playerOneName", event.target.value)
              }
            />

            <label>Player 2</label>
            <input
              value={tournamentForm.playerTwoName}
              placeholder="Player two name"
              onChange={(event) =>
                updateTournamentField("playerTwoName", event.target.value)
              }
            />

            <label>Court</label>
            <select
              value={tournamentForm.courtId}
              onChange={(event) =>
                updateTournamentField("courtId", event.target.value)
              }
            >
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>

            <div className="inline-form-row">
              <div>
                <label>Date</label>
                <input
                  type="date"
                  value={tournamentForm.date}
                  onChange={(event) =>
                    updateTournamentField("date", event.target.value)
                  }
                />
              </div>

              <div>
                <label>Start hour</label>
                <input
                  type="time"
                  value={tournamentForm.startHour}
                  onChange={(event) =>
                    updateTournamentField("startHour", event.target.value)
                  }
                />
              </div>
            </div>

            <label>Duration</label>
            <select
              value={tournamentForm.duration}
              onChange={(event) =>
                updateTournamentField("duration", event.target.value)
              }
            >
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </select>

            <label>Note</label>
            <textarea
              value={tournamentForm.note}
              placeholder="Optional tournament note..."
              onChange={(event) =>
                updateTournamentField("note", event.target.value)
              }
            />

            <button type="submit">Create tournament match</button>
          </form>

          <div className="section-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Schedule</p>
                <h2>Tournament matches</h2>
              </div>
            </div>

            {tournamentMatches.length === 0 ? (
              <div className="empty-state compact-empty">
                <h3>No tournament matches yet</h3>
                <p>Create a tournament match first.</p>
              </div>
            ) : (
              <div className="list">
                {tournamentMatches.map((match) => (
                  <div key={match.id} className="list-item">
                    <div className="card-top">
                      <div>
                        <h3>{match.title || "Tournament Match"}</h3>
                        <p>
                          {match.playerOneName} vs {match.playerTwoName}
                        </p>
                        <small>
                          {match.court.name} / {formatDate(match.startTime)}
                        </small>
                      </div>

                      <span className={`badge ${match.status.toLowerCase()}`}>
                        {match.status}
                      </span>
                    </div>

                    <div className="details-box">
                      <div className="detail-row">
                        <span>Score</span>
                        <strong>{match.score || "Not entered"}</strong>
                      </div>

                      <div className="detail-row">
                        <span>Winner</span>
                        <strong>{match.winnerName || "Not selected"}</strong>
                      </div>
                    </div>

                    <div className="score-update-box">
                      <input
                        placeholder="Score e.g. 6-4, 6-3"
                        onBlur={(event) => {
                          const score = event.target.value;
                          if (score.trim()) {
                            updateTournamentScore(
                              match.id,
                              score,
                              match.winnerName || ""
                            );
                          }
                        }}
                      />

                      <select
                        defaultValue={match.winnerName || ""}
                        onChange={(event) => {
                          updateTournamentScore(
                            match.id,
                            match.score || "",
                            event.target.value
                          );
                        }}
                      >
                        <option value="">Select winner</option>
                        <option value={match.playerOneName}>
                          {match.playerOneName}
                        </option>
                        <option value={match.playerTwoName}>
                          {match.playerTwoName}
                        </option>
                      </select>
                    </div>

                    <div className="button-row wrap">
                      <button
                        className="secondary-button"
                        onClick={() =>
                          updateTournamentMatchStatus(match.id, "SCHEDULED")
                        }
                      >
                        Scheduled
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() =>
                          updateTournamentMatchStatus(match.id, "COMPLETED")
                        }
                      >
                        Completed
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() =>
                          updateTournamentMatchStatus(match.id, "CANCELLED")
                        }
                      >
                        Cancelled
                      </button>

                      <button
                        className="danger-button"
                        onClick={() => handleDeleteTournamentMatch(match.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminPage;