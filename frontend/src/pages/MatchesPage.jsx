import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const getTomorrowDateValue = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

const MatchesPage = () => {
  const { user } = useAuth();

  const [courts, setCourts] = useState([]);
  const [matches, setMatches] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [message, setMessage] = useState({
    type: "",
    text: ""
  });
  const [selectedLevel, setSelectedLevel] = useState("ALL");

  const [formData, setFormData] = useState({
    courtId: "",
    title: "",
    description: "",
    preferredLevel: "BEGINNER",
    date: getTomorrowDateValue(),
    startHour: "17:00",
    duration: "60"
  });

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  };

  const loadData = async () => {
    try {
      const [courtsRes, matchesRes, myMatchesRes] = await Promise.all([
        api.get("/courts"),
        api.get("/matches"),
        api.get("/matches/my")
      ]);

      setCourts(courtsRes.data.courts);
      setMatches(matchesRes.data.matchPosts);
      setMyMatches(myMatchesRes.data.matchPosts);

      if (!formData.courtId && courtsRes.data.courts.length > 0) {
        updateField("courtId", String(courtsRes.data.courts[0].id));
      }
    } catch (error) {
      console.log("Match load error", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMatches = useMemo(() => {
    const futureOpenMatches = matches.filter((match) => {
      return new Date(match.startTime) > new Date();
    });

    if (selectedLevel === "ALL") {
      return futureOpenMatches;
    }

    return futureOpenMatches.filter(
      (match) => match.preferredLevel === selectedLevel
    );
  }, [matches, selectedLevel]);

  const hasRequested = (match) => {
    return match.requests.some((request) => request.requesterId === user?.id);
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      setMessage({
        type: "",
        text: ""
      });

      if (!formData.date || !formData.title.trim()) {
        setMessage({
          type: "error",
          text: "Please enter a title and select a date."
        });
        return;
      }

      const startTime = new Date(`${formData.date}T${formData.startHour}:00`);
      const endTime = new Date(
        startTime.getTime() + Number(formData.duration) * 60 * 1000
      );

      await api.post("/matches", {
        courtId: Number(formData.courtId),
        title: formData.title,
        description: formData.description,
        preferredLevel: formData.preferredLevel,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      setMessage({
        type: "success",
        text: "Match post created successfully. Students can now request to join."
      });

      setFormData((current) => ({
        ...current,
        title: "",
        description: ""
      }));

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Match post failed."
      });
    }
  };

  const handleJoinRequest = async (matchId) => {
    try {
      setMessage({
        type: "",
        text: ""
      });

      await api.post(`/matches/${matchId}/requests`, {
        note: "I would like to join this match."
      });

      setMessage({
        type: "success",
        text: "Join request sent successfully."
      });

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Request failed."
      });
    }
  };

  const handleRequestStatus = async (requestId, status) => {
    try {
      setMessage({
        type: "",
        text: ""
      });

      await api.patch(`/matches/requests/${requestId}/status`, {
        status
      });

      setMessage({
        type: "success",
        text: `Request ${status.toLowerCase()} successfully.`
      });

      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Update failed."
      });
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
      <div className="section-card page-banner">
        <div>
          <p className="eyebrow">Social tennis layer</p>
          <h2>Find the right player, not just an empty court</h2>
          <p>
            Create match posts, receive requests and approve players only when
            both the time and profile feel right.
          </p>
        </div>

        <div className="banner-metric">
          <span>Open matches</span>
          <strong>{filteredMatches.length}</strong>
        </div>
      </div>

      {message.text && (
        <div className={`alert ${message.type === "error" ? "error" : ""}`}>
          {message.text}
        </div>
      )}

      <div className="two-column">
        <form onSubmit={handleCreate} className="section-card form premium-form-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Create</p>
              <h2>New match post</h2>
            </div>
          </div>

          <label>Court</label>
          <select
            value={formData.courtId}
            onChange={(event) => updateField("courtId", event.target.value)}
          >
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>

          <label>Title</label>
          <input
            value={formData.title}
            placeholder="Looking for a beginner-friendly partner"
            onChange={(event) => updateField("title", event.target.value)}
          />

          <label>Description</label>
          <textarea
            value={formData.description}
            placeholder="Tell others your level, style and what kind of session you want."
            onChange={(event) => updateField("description", event.target.value)}
          />

          <label>Preferred level</label>
          <select
            value={formData.preferredLevel}
            onChange={(event) =>
              updateField("preferredLevel", event.target.value)
            }
          >
            <option value="BEGINNER">Beginner</option>
            <option value="BEGINNER_PLUS">Beginner+</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>

          <div className="inline-form-row">
            <div>
              <label>Date</label>
              <input
                type="date"
                min={getTomorrowDateValue()}
                value={formData.date}
                onChange={(event) => updateField("date", event.target.value)}
              />
            </div>

            <div>
              <label>Start hour</label>
              <input
                type="time"
                value={formData.startHour}
                onChange={(event) => updateField("startHour", event.target.value)}
              />
            </div>
          </div>

          <label>Duration</label>
          <select
            value={formData.duration}
            onChange={(event) => updateField("duration", event.target.value)}
          >
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
            <option value="120">120 minutes</option>
          </select>

          <p className="helper-text">
            Creating a match post also reserves the selected court time for you.
            Once you accept a request, the match becomes confirmed.
          </p>

          <button type="submit">Create match post</button>
        </form>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Yours</p>
              <h2>My match posts</h2>
            </div>
          </div>

          {myMatches.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>No match posts yet</h3>
              <p>Your created match posts and incoming requests will appear here.</p>
            </div>
          ) : (
            <div className="list">
              {myMatches.map((match) => (
                <div key={match.id} className="list-item">
                  <div className="card-top">
                    <div>
                      <h3>{match.title}</h3>
                      <p>{match.court.name}</p>
                    </div>
                    <span className={`badge ${match.status.toLowerCase()}`}>
                      {match.status}
                    </span>
                  </div>

                  <small>{formatDate(match.startTime)}</small>

                  {match.requests.length === 0 ? (
                    <div className="tiny-empty">
                      No requests yet. This post is visible to other students.
                    </div>
                  ) : (
                    <div className="request-box">
                      <strong>Incoming requests</strong>

                      {match.requests.map((request) => (
                        <div key={request.id} className="request-row premium-request-row">
                          <div>
                            <strong>{request.requester.fullName}</strong>
                            <small>
                              {request.requester.tennisLevel} /{" "}
                              {request.requester.hasRacket
                                ? "Has racket"
                                : "Needs racket"}
                            </small>
                            {request.note && <p>{request.note}</p>}
                          </div>

                          <span className={`badge ${request.status.toLowerCase()}`}>
                            {request.status}
                          </span>

                          {request.status === "PENDING" && (
                            <div className="button-row">
                              <button
                                onClick={() =>
                                  handleRequestStatus(request.id, "ACCEPTED")
                                }
                              >
                                Accept
                              </button>
                              <button
                                className="secondary-button"
                                onClick={() =>
                                  handleRequestStatus(request.id, "REJECTED")
                                }
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="section-card lesson-toolbar">
        <div>
          <p className="eyebrow">Discover</p>
          <h2>Open match posts</h2>
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

      {filteredMatches.length === 0 ? (
        <div className="section-card empty-state">
          <h3>No open matches found</h3>
          <p>
            Create the first match post or switch the level filter to see more
            options.
          </p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredMatches.map((match) => {
            const isMine = match.creator.id === user?.id;
            const requested = hasRequested(match);

            return (
              <div key={match.id} className="section-card premium-card">
                <div className="card-top">
                  <div>
                    <p className="mini-eyebrow">{match.court.name}</p>
                    <h2>{match.title}</h2>
                  </div>

                  <span className={`badge ${match.status.toLowerCase()}`}>
                    {match.status}
                  </span>
                </div>

                <p className="card-description">
                  {match.description || "No description provided."}
                </p>

                <div className="player-card">
                  <div className="user-avatar">
                    {match.creator.fullName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>{match.creator.fullName}</strong>
                    <small>
                      {match.creator.tennisLevel} /{" "}
                      {match.creator.hasRacket ? "Has racket" : "Needs racket"}
                    </small>
                  </div>
                </div>

                <div className="details-box">
                  <div className="detail-row">
                    <span>Time</span>
                    <strong>{formatDate(match.startTime)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Preferred level</span>
                    <strong>{match.preferredLevel}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Requests</span>
                    <strong>{match.requests.length}</strong>
                  </div>
                </div>

                {isMine ? (
                  <div className="status-panel">
                    <span>This is your post</span>
                    <strong>Manage requests above</strong>
                  </div>
                ) : requested ? (
                  <button disabled>Request already sent</button>
                ) : (
                  <button onClick={() => handleJoinRequest(match.id)}>
                    Request to join
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MatchesPage;
