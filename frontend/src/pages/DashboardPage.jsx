import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  const [announcements, setAnnouncements] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [myLessonApplications, setMyLessonApplications] = useState([]);
  const [myPartnerSearches, setMyPartnerSearches] = useState([]);
  const [myJoinRequests, setMyJoinRequests] = useState([]);
  const [tournamentMatches, setTournamentMatches] = useState([]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [
        announcementsRes,
        reservationsRes,
        lessonApplicationsRes,
        myMatchesRes,
        myRequestsRes,
        tournamentRes
      ] = await Promise.all([
        api.get("/announcements"),
        api.get("/reservations/my"),
        api.get("/lessons/my-applications"),
        api.get("/matches/my"),
        api.get("/matches/my-requests"),
        api.get("/tournaments")
      ]);

      setAnnouncements(announcementsRes.data.announcements || []);
      setMyReservations(reservationsRes.data.reservations || []);
      setMyLessonApplications(lessonApplicationsRes.data.applications || []);
      setMyPartnerSearches(myMatchesRes.data.matchPosts || []);
      setMyJoinRequests(myRequestsRes.data.requests || []);
      setTournamentMatches(tournamentRes.data.matches || []);
    } catch (error) {
      console.log("Dashboard load error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const upcomingReservations = useMemo(() => {
    return myReservations
      .filter((reservation) => {
        return (
          reservation.status !== "CANCELLED" &&
          new Date(reservation.endTime) >= new Date()
        );
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [myReservations]);

  const nextReservation = upcomingReservations[0];

  const activeLessonApplications = useMemo(() => {
    return myLessonApplications
      .filter((application) => {
        return (
          application.lesson &&
          new Date(application.lesson.startTime) >= new Date() &&
          application.status !== "REJECTED"
        );
      })
      .sort(
        (a, b) =>
          new Date(a.lesson.startTime) - new Date(b.lesson.startTime)
      );
  }, [myLessonApplications]);

  const nextLessonApplication = activeLessonApplications[0];

  const activePartnerSearches = useMemo(() => {
    return myPartnerSearches
      .filter((match) => {
        return (
          ["OPEN", "MATCHED"].includes(match.status) &&
          new Date(match.startTime) >= new Date()
        );
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [myPartnerSearches]);

  const pendingJoinRequests = useMemo(() => {
    return myJoinRequests.filter((request) => {
      return (
        request.status === "PENDING" &&
        request.matchPost?.status !== "CANCELLED" &&
        new Date(request.matchPost?.startTime) >= new Date()
      );
    });
  }, [myJoinRequests]);

  const upcomingTournamentMatches = useMemo(() => {
    return tournamentMatches
      .filter((match) => {
        return (
          match.status === "SCHEDULED" &&
          new Date(match.startTime) >= new Date()
        );
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [tournamentMatches]);

  const nextTournamentMatch = upcomingTournamentMatches[0];

  const nextBestAction = useMemo(() => {
    if (!user?.hasRacket) {
      return {
        title: "Update your racket status",
        text:
          "Racket availability is important because the club has limited equipment. Update your profile if you find or borrow a racket.",
        link: "/profile",
        button: "Go to Profile"
      };
    }

    if (!nextLessonApplication && !nextReservation) {
      return {
        title: "Start with a lesson or reservation",
        text:
          "You do not have an upcoming tennis activity yet. You can apply to a lesson or reserve a court.",
        link: "/lessons",
        button: "View Lessons"
      };
    }

    if (pendingJoinRequests.length > 0) {
      return {
        title: "You have pending join requests",
        text:
          "Your requests are waiting for approval. Keep an eye on the Matches page for updates.",
        link: "/matches",
        button: "View Requests"
      };
    }

    if (activePartnerSearches.length > 0) {
      return {
        title: "Manage your partner search",
        text:
          "You have an active partner-search post. Check if someone requested to join.",
        link: "/matches",
        button: "Manage Matches"
      };
    }

    return {
      title: "You are all set",
      text:
        "Your upcoming tennis activity is planned. Check announcements for any club updates.",
      link: "/",
      button: "Refresh Dashboard"
    };
  }, [
    user,
    nextLessonApplication,
    nextReservation,
    pendingJoinRequests,
    activePartnerSearches
  ]);

  const formatDate = (dateText) => {
    if (!dateText) {
      return "-";
    }

    return new Date(dateText).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const getAcceptedRequest = (match) => {
    return match.requests?.find((request) => request.status === "ACCEPTED");
  };

  if (loading) {
    return (
      <section className="page">
        <div className="section-card empty-state">
          <h3>Loading dashboard...</h3>
          <p>Your tennis activity is being prepared.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="smart-dashboard-hero">
        <div className="section-card smart-main-card">
          <p className="eyebrow">Welcome back</p>
          <h2>{user?.fullName}</h2>
          <p>
            This is your personal tennis overview. Track your reservations,
            lessons, partner searches, requests and tournament updates in one
            place.
          </p>

          <div className="smart-action-card">
            <div>
              <span>Next best action</span>
              <h3>{nextBestAction.title}</h3>
              <p>{nextBestAction.text}</p>
            </div>

            {nextBestAction.link === "/" ? (
              <button onClick={loadDashboard}>{nextBestAction.button}</button>
            ) : (
              <Link to={nextBestAction.link} className="cta-link primary-link">
                {nextBestAction.button}
              </Link>
            )}
          </div>
        </div>

        <div className="section-card smart-status-card">
          <p className="eyebrow">Your status</p>

          <div className="dashboard-status-grid">
            <div>
              <span>Level</span>
              <strong>{user?.tennisLevel}</strong>
            </div>

            <div>
              <span>Racket</span>
              <strong>{user?.hasRacket ? "Ready" : "May need racket"}</strong>
            </div>

            <div>
              <span>Upcoming</span>
              <strong>{upcomingReservations.length}</strong>
            </div>

            <div>
              <span>Requests</span>
              <strong>{pendingJoinRequests.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="smart-overview-grid">
        <div className="section-card dashboard-info-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Upcoming</p>
              <h2>Next reservation</h2>
            </div>

            <Link to="/reservations" className="inline-link">
              View all →
            </Link>
          </div>

          {!nextReservation ? (
            <div className="empty-state compact-empty">
              <h3>No upcoming reservation</h3>
              <p>Reserve a court when you are ready to play.</p>
            </div>
          ) : (
            <div className="dashboard-detail-card">
              <div className="card-top">
                <div>
                  <h3>{nextReservation.court.name}</h3>
                  <p>{formatDate(nextReservation.startTime)}</p>
                </div>

                <span className={`badge ${nextReservation.status.toLowerCase()}`}>
                  {nextReservation.status}
                </span>
              </div>

              <div className="details-box">
                <div className="detail-row">
                  <span>Type</span>
                  <strong>{nextReservation.type}</strong>
                </div>

                {nextReservation.matchPost && (
                  <div className="detail-row">
                    <span>Partner search</span>
                    <strong>{nextReservation.matchPost.status}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="section-card dashboard-info-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Lessons</p>
              <h2>Lesson application</h2>
            </div>

            <Link to="/lessons" className="inline-link">
              View lessons →
            </Link>
          </div>

          {!nextLessonApplication ? (
            <div className="empty-state compact-empty">
              <h3>No active lesson application</h3>
              <p>Apply to a lesson to start learning with the club.</p>
            </div>
          ) : (
            <div className="dashboard-detail-card">
              <div className="card-top">
                <div>
                  <h3>{nextLessonApplication.lesson.title}</h3>
                  <p>{formatDate(nextLessonApplication.lesson.startTime)}</p>
                </div>

                <span
                  className={`badge ${nextLessonApplication.status.toLowerCase()}`}
                >
                  {nextLessonApplication.status}
                </span>
              </div>

              <div className="details-box">
                <div className="detail-row">
                  <span>Court</span>
                  <strong>{nextLessonApplication.lesson.court.name}</strong>
                </div>

                <div className="detail-row">
                  <span>Level</span>
                  <strong>{nextLessonApplication.lesson.level}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="section-card dashboard-info-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Matches</p>
              <h2>Partner search</h2>
            </div>

            <Link to="/matches" className="inline-link">
              View matches →
            </Link>
          </div>

          {activePartnerSearches.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>No active partner search</h3>
              <p>
                Use Reserve Court and select “Looking for partner” to publish a
                search.
              </p>
            </div>
          ) : (
            <div className="list">
              {activePartnerSearches.slice(0, 2).map((match) => {
                const acceptedRequest = getAcceptedRequest(match);

                return (
                  <div key={match.id} className="list-item">
                    <div className="card-top">
                      <div>
                        <h3>{match.title}</h3>
                        <p>{formatDate(match.startTime)}</p>
                      </div>

                      <span className={`badge ${match.status.toLowerCase()}`}>
                        {match.status}
                      </span>
                    </div>

                    {acceptedRequest ? (
                      <small>
                        Matched with {acceptedRequest.requester.fullName}
                      </small>
                    ) : (
                      <small>{match.requests.length} incoming request(s)</small>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="section-card dashboard-info-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Requests</p>
              <h2>My join requests</h2>
            </div>

            <Link to="/matches" className="inline-link">
              Manage →
            </Link>
          </div>

          {pendingJoinRequests.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>No pending requests</h3>
              <p>Requests you send to other players will appear here.</p>
            </div>
          ) : (
            <div className="list">
              {pendingJoinRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="list-item">
                  <div className="card-top">
                    <div>
                      <h3>{request.matchPost.title}</h3>
                      <p>{request.matchPost.creator.fullName}</p>
                    </div>

                    <span className="badge pending">PENDING</span>
                  </div>

                  <small>{formatDate(request.matchPost.startTime)}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="two-column dashboard-columns">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Updates</p>
              <h2>Latest announcements</h2>
            </div>
          </div>

          {announcements.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>No announcements yet</h3>
              <p>Club updates will appear here.</p>
            </div>
          ) : (
            <div className="announcement-list">
              {announcements.slice(0, 4).map((announcement) => (
                <div key={announcement.id} className="announcement-item">
                  <p className="mini-eyebrow">Announcement</p>
                  <h3>{announcement.title}</h3>
                  <p>{announcement.content}</p>
                  <small>By {announcement.createdBy.fullName}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Tournament</p>
              <h2>Upcoming tournament match</h2>
            </div>

            <Link to="/tournament" className="inline-link">
              Full schedule →
            </Link>
          </div>

          {!nextTournamentMatch ? (
            <div className="empty-state compact-empty">
              <h3>No upcoming tournament match</h3>
              <p>Tournament schedule will appear here when admins add matches.</p>
            </div>
          ) : (
            <div className="dashboard-tournament-preview">
              <div className="card-top">
                <div>
                  <p className="mini-eyebrow">{nextTournamentMatch.court.name}</p>
                  <h3>{nextTournamentMatch.title || "Tournament Match"}</h3>
                  <p>{formatDate(nextTournamentMatch.startTime)}</p>
                </div>

                <span className="badge scheduled">SCHEDULED</span>
              </div>

              <div className="tournament-versus compact-versus">
                <div>
                  <span>Player 1</span>
                  <strong>{nextTournamentMatch.playerOneName}</strong>
                </div>

                <div className="versus-badge">VS</div>

                <div>
                  <span>Player 2</span>
                  <strong>{nextTournamentMatch.playerTwoName}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Quick actions</p>
            <h2>What would you like to do?</h2>
          </div>
        </div>

        <div className="quick-grid improved-quick-grid">
          <Link to="/reservations" className="quick-action-card">
            <div>
              <p className="quick-action-eyebrow">Book</p>
              <h3>Reserve court</h3>
              <p>Create a reservation or publish a partner-search post.</p>
            </div>
            <span>→</span>
          </Link>

          <Link to="/lessons" className="quick-action-card">
            <div>
              <p className="quick-action-eyebrow">Learn</p>
              <h3>Join lessons</h3>
              <p>Apply to beginner-friendly tennis lessons.</p>
            </div>
            <span>→</span>
          </Link>

          <Link to="/matches" className="quick-action-card">
            <div>
              <p className="quick-action-eyebrow">Connect</p>
              <h3>Find players</h3>
              <p>Discover partner-search posts and requests.</p>
            </div>
            <span>→</span>
          </Link>

          <Link to="/tournament" className="quick-action-card">
            <div>
              <p className="quick-action-eyebrow">Follow</p>
              <h3>Tournament</h3>
              <p>View tournament schedule and completed results.</p>
            </div>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;