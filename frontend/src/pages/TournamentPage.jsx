import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import PageLoader from "../components/PageLoader";
import { useToast } from "../context/ToastContext";

const TournamentPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  const [matches, setMatches] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const loadMatches = async () => {
    try {
      setLoading(true);

      const response = await api.get("/tournaments", {
        params: selectedStatus !== "ALL" ? { status: selectedStatus } : {}
      });

      setMatches(response.data.matches);
    } catch (error) {
      toast.error("Could not load tournament matches.");
      console.log("Tournament load error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [selectedStatus]);

  const groupedMatches = useMemo(() => {
    const now = new Date();

    const scheduled = matches.filter((match) => {
      return match.status === "SCHEDULED" && new Date(match.startTime) >= now;
    });

    const pastOrCompleted = matches.filter((match) => {
      return match.status !== "SCHEDULED" || new Date(match.startTime) < now;
    });

    return {
      scheduled,
      pastOrCompleted
    };
  }, [matches]);

  const formatDate = (dateText) => {
    return new Date(dateText).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const renderMatchCard = (match) => {
    return (
      <div key={match.id} className="section-card tournament-match-card">
        <div className="card-top">
          <div>
            <p className="mini-eyebrow">{match.court.name}</p>
            <h2>{match.title || "Tournament Match"}</h2>
          </div>

          <span className={`badge ${match.status.toLowerCase()}`}>
            {match.status}
          </span>
        </div>

        <div className="tournament-versus">
          <div>
            <span>Player 1</span>
            <strong>{match.playerOneName}</strong>
          </div>

          <div className="versus-badge">VS</div>

          <div>
            <span>Player 2</span>
            <strong>{match.playerTwoName}</strong>
          </div>
        </div>

        <div className="details-box">
          <div className="detail-row">
            <span>Time</span>
            <strong>{formatDate(match.startTime)}</strong>
          </div>

          <div className="detail-row">
            <span>Court</span>
            <strong>{match.court.name}</strong>
          </div>

          {match.score && (
            <div className="detail-row">
              <span>Score</span>
              <strong>{match.score}</strong>
            </div>
          )}

          {match.winnerName && (
            <div className="detail-row">
              <span>Winner</span>
              <strong>{match.winnerName}</strong>
            </div>
          )}
        </div>

        {match.note && <div className="student-note">“{match.note}”</div>}
      </div>
    );
  };

  if (loading) {
    return (
      <PageLoader
        title="Loading tournament..."
        text="Tournament schedule and match results are being prepared."
      />
    );
  }

  return (
    <section className="page">
      <div className="section-card page-banner">
        <div>
          <p className="eyebrow">Tournament schedule</p>
          <h2>AGÜ Tennis Tournament Program</h2>
          <p>
            Follow scheduled tournament matches, court assignments and completed
            match results from one clean page.
          </p>
        </div>

        <div className="banner-metric">
          <span>Total matches</span>
          <strong>{matches.length}</strong>
        </div>
      </div>

      <div className="section-card lesson-toolbar">
        <div>
          <p className="eyebrow">Filter</p>
          <h2>Match status</h2>
        </div>

        <div className="segmented-control">
          <button
            className={selectedStatus === "ALL" ? "segment-active" : ""}
            onClick={() => setSelectedStatus("ALL")}
          >
            All
          </button>

          <button
            className={selectedStatus === "SCHEDULED" ? "segment-active" : ""}
            onClick={() => setSelectedStatus("SCHEDULED")}
          >
            Scheduled
          </button>

          <button
            className={selectedStatus === "COMPLETED" ? "segment-active" : ""}
            onClick={() => setSelectedStatus("COMPLETED")}
          >
            Completed
          </button>

          <button
            className={selectedStatus === "CANCELLED" ? "segment-active" : ""}
            onClick={() => setSelectedStatus("CANCELLED")}
          >
            Cancelled
          </button>
        </div>
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Upcoming</p>
            <h2>Scheduled matches</h2>
          </div>
        </div>

        {groupedMatches.scheduled.length === 0 ? (
          <div className="empty-state compact-empty">
            <h3>No scheduled tournament matches</h3>
            <p>Upcoming tournament matches will appear here.</p>
          </div>
        ) : (
          <div className="card-grid">
            {groupedMatches.scheduled.map((match) => renderMatchCard(match))}
          </div>
        )}
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">History</p>
            <h2>Completed / cancelled matches</h2>
          </div>
        </div>

        {groupedMatches.pastOrCompleted.length === 0 ? (
          <div className="empty-state compact-empty">
            <h3>No match history yet</h3>
            <p>Completed and cancelled tournament matches will appear here.</p>
          </div>
        ) : (
          <div className="card-grid">
            {groupedMatches.pastOrCompleted.map((match) =>
              renderMatchCard(match)
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TournamentPage;