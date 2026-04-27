import { useEffect, useState } from "react";
import api from "../api/api";

const MatchesPage = () => {
  const [courts, setCourts] = useState([]);
  const [matches, setMatches] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    courtId: "",
    title: "",
    description: "",
    preferredLevel: "BEGINNER",
    date: "",
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

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      setMessage("");

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

      setMessage("Match post created successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Match post failed.");
    }
  };

  const handleJoinRequest = async (matchId) => {
    try {
      setMessage("");

      await api.post(`/matches/${matchId}/requests`, {
        note: "I would like to join this match."
      });

      setMessage("Join request sent successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Request failed.");
    }
  };

  const handleRequestStatus = async (requestId, status) => {
    try {
      setMessage("");

      await api.patch(`/matches/requests/${requestId}/status`, {
        status
      });

      setMessage("Request updated successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Update failed.");
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
          <p className="eyebrow">Find your partner</p>
          <h1>Matches</h1>
          <p>Create match posts and find students at your tennis level.</p>
        </div>
      </div>

      {message && <div className="alert">{message}</div>}

      <div className="two-column">
        <form onSubmit={handleCreate} className="section-card form">
          <h2>Create match post</h2>

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
            placeholder="Looking for beginner partner"
            onChange={(event) => updateField("title", event.target.value)}
          />

          <label>Description</label>
          <textarea
            value={formData.description}
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

          <label>Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(event) => updateField("date", event.target.value)}
          />

          <label>Start hour</label>
          <input
            type="time"
            value={formData.startHour}
            onChange={(event) => updateField("startHour", event.target.value)}
          />

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

          <button type="submit">Create match</button>
        </form>

        <div className="section-card">
          <h2>My match posts</h2>

          {myMatches.length === 0 ? (
            <p className="muted">No match posts yet.</p>
          ) : (
            <div className="list">
              {myMatches.map((match) => (
                <div key={match.id} className="list-item">
                  <div className="card-top">
                    <h3>{match.title}</h3>
                    <span className="badge">{match.status}</span>
                  </div>

                  <p>{match.court.name}</p>
                  <small>{formatDate(match.startTime)}</small>

                  {match.requests.length > 0 && (
                    <div className="request-box">
                      <strong>Requests</strong>
                      {match.requests.map((request) => (
                        <div key={request.id} className="request-row">
                          <span>
                            {request.requester.fullName} -{" "}
                            {request.requester.tennisLevel}
                          </span>
                          <span>{request.status}</span>

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

      <div className="section-card">
        <h2>Open match posts</h2>

        {matches.length === 0 ? (
          <p className="muted">No open matches yet.</p>
        ) : (
          <div className="card-grid">
            {matches.map((match) => (
              <div key={match.id} className="mini-card">
                <div className="card-top">
                  <h3>{match.title}</h3>
                  <span className="badge">{match.status}</span>
                </div>

                <p>{match.description}</p>
                <small>{match.court.name}</small>
                <small>{formatDate(match.startTime)}</small>
                <small>
                  {match.creator.fullName} / {match.creator.tennisLevel}
                </small>

                <button onClick={() => handleJoinRequest(match.id)}>
                  Request to join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MatchesPage;
