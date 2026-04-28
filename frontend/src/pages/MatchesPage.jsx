import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const MatchesPage = () => {
  const { user } = useAuth();

  const [matches, setMatches] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [message, setMessage] = useState({
    type: "",
    text: ""
  });
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [cancelReasons, setCancelReasons] = useState({});

  const loadData = async () => {
    try {
      const [matchesRes, myMatchesRes, myRequestsRes] = await Promise.all([
        api.get("/matches"),
        api.get("/matches/my"),
        api.get("/matches/my-requests")
      ]);

      setMatches(matchesRes.data.matchPosts);
      setMyMatches(myMatchesRes.data.matchPosts);
      setMyRequests(myRequestsRes.data.requests);
    } catch (error) {
      console.log("Match load error", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeMyPartnerSearches = useMemo(() => {
    return myMatches.filter((match) =>
      ["OPEN", "MATCHED"].includes(match.status)
    ).length;
  }, [myMatches]);

  const filteredMatches = useMemo(() => {
    const futureOpenMatches = matches.filter((match) => {
      return (
        match.status !== "CANCELLED" &&
        new Date(match.startTime) > new Date()
      );
    });

    if (selectedLevel === "ALL") {
      return futureOpenMatches;
    }

    return futureOpenMatches.filter(
      (match) => match.preferredLevel === selectedLevel
    );
  }, [matches, selectedLevel]);

  const visibleMyMatches = useMemo(() => {
    return myMatches.filter((match) => match.status !== "CANCELLED");
  }, [myMatches]);

  const visibleMyRequests = useMemo(() => {
    return myRequests.filter((request) => {
      return (
        request.status !== "CANCELLED" &&
        request.matchPost?.status !== "CANCELLED"
      );
    });
  }, [myRequests]);

  const hasRequested = (match) => {
    return match.requests.some((request) => request.requesterId === user?.id);
  };

  const getAcceptedRequest = (match) => {
    return match.requests.find((request) => request.status === "ACCEPTED");
  };

  const updateCancelReason = (matchId, value) => {
    setCancelReasons((current) => ({
      ...current,
      [matchId]: value
    }));
  };

  const handleCancelMatch = async (matchId) => {
    try {
      setMessage({
        type: "",
        text: ""
      });

      await api.patch(`/matches/${matchId}/cancel`, {
        reason: cancelReasons[matchId] || ""
      });

      setMessage({
        type: "success",
        text: "Match cancelled successfully."
      });

      updateCancelReason(matchId, "");
      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Cancel failed."
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
          <p className="eyebrow">Partner search hub</p>
          <h2>Matches are now created from Reserve Court</h2>
          <p>
            To publish a new partner-search post, first choose a court and time
            from Reserve Court, then select “Looking for partner”.
          </p>
        </div>

        <div className="admin-metrics">
          <div className="banner-metric">
            <span>Open searches</span>
            <strong>{filteredMatches.length}</strong>
          </div>
          <div className="banner-metric">
            <span>My active</span>
            <strong>{activeMyPartnerSearches}</strong>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`alert ${message.type === "error" ? "error" : ""}`}>
          {message.text}
        </div>
      )}

      <div className="section-card match-create-hint-card">
        <div>
          <p className="eyebrow">Create a partner search</p>
          <h2>Reserve a court first</h2>
          <p>
            Partner-search posts are connected to real court reservations so the
            court time is always protected and visible in the reservation system.
          </p>
        </div>

        <Link to="/reservations" className="cta-link primary-link">
          Go to Reserve Court
        </Link>
      </div>

      <div className="section-card lesson-toolbar">
        <div>
          <p className="eyebrow">Discover</p>
          <h2>Open partner searches</h2>
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
          <h3>No open partner searches found</h3>
          <p>
            Create the first partner-search reservation or switch the level
            filter to see more options.
          </p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredMatches.map((match) => {
            const isMine = match.creator.id === user?.id;
            const requested = hasRequested(match);
            const acceptedRequest = getAcceptedRequest(match);

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

                {acceptedRequest && (
                  <div className="status-panel">
                    <span>Matched with</span>
                    <strong>{acceptedRequest.requester.fullName}</strong>
                  </div>
                )}

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
                    <strong>Manage requests below</strong>
                  </div>
                ) : requested ? (
                  <button disabled>Request already sent</button>
                ) : match.status === "OPEN" ? (
                  <button onClick={() => handleJoinRequest(match.id)}>
                    Request to join
                  </button>
                ) : (
                  <button disabled>Already matched</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="two-column dashboard-columns">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Yours</p>
              <h2>My partner searches</h2>
            </div>
          </div>

          {visibleMyMatches.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>No partner searches yet</h3>
              <p>
                Create one from Reserve Court by selecting “Looking for partner”.
              </p>
            </div>
          ) : (
            <div className="list">
              {visibleMyMatches.map((match) => {
                const acceptedRequest = getAcceptedRequest(match);
                const canCancel = ["OPEN", "MATCHED"].includes(match.status);

                return (
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

                    {acceptedRequest && (
                      <div className="matched-partner-card">
                        <div className="user-avatar compact-avatar">
                          {acceptedRequest.requester.fullName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <span>Matched partner</span>
                          <strong>{acceptedRequest.requester.fullName}</strong>
                          <small>
                            {acceptedRequest.requester.tennisLevel} /{" "}
                            {acceptedRequest.requester.hasRacket
                              ? "Has racket"
                              : "Needs racket"}
                          </small>
                        </div>
                      </div>
                    )}

                    {match.requests.length === 0 ? (
                      <div className="tiny-empty">
                        No requests yet. This post is visible to other students.
                      </div>
                    ) : (
                      <div className="request-box">
                        <strong>Incoming requests</strong>

                        {match.requests.map((request) => (
                          <div
                            key={request.id}
                            className="request-row premium-request-row"
                          >
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

                            {request.status === "PENDING" &&
                              match.status === "OPEN" && (
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

                    {canCancel && (
                      <div className="cancel-match-box">
                        <label>Cancellation note</label>
                        <textarea
                          placeholder={
                            acceptedRequest
                              ? "Optional note for your matched partner..."
                              : "Optional reason for cancellation..."
                          }
                          value={cancelReasons[match.id] || ""}
                          onChange={(event) =>
                            updateCancelReason(match.id, event.target.value)
                          }
                        />

                        <button
                          className="danger-button"
                          onClick={() => handleCancelMatch(match.id)}
                        >
                          Cancel match
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Requests sent</p>
              <h2>My join requests</h2>
            </div>
          </div>

          {visibleMyRequests.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>No join requests yet</h3>
              <p>When you request to join another match, it will appear here.</p>
            </div>
          ) : (
            <div className="list">
              {visibleMyRequests.map((request) => (
                <div key={request.id} className="list-item">
                  <div className="card-top">
                    <div>
                      <h3>{request.matchPost.title}</h3>
                      <p>{request.matchPost.court.name}</p>
                    </div>

                    <span className={`badge ${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                  </div>

                  <small>{formatDate(request.matchPost.startTime)}</small>
                  <small>Created by {request.matchPost.creator.fullName}</small>

                  {request.status === "PENDING" && (
                    <button
                      className="secondary-button"
                      onClick={() =>
                        handleRequestStatus(request.id, "CANCELLED")
                      }
                    >
                      Cancel request
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MatchesPage;