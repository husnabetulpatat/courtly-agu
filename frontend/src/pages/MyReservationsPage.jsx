import { useEffect, useState } from "react";
import api from "../api/api";

const formatDateTime = (dateText) => {
  return new Date(dateText).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

const MyReservationsPage = () => {
  const [myReservations, setMyReservations] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadData = async () => {
    try {
      const res = await api.get("/reservations/my");
      setMyReservations(res.data.reservations);
    } catch (error) {
      console.log("My reservations load error", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = async (id) => {
    try {
      await api.patch(`/reservations/${id}/cancel`);
      setMessage({
        type: "success",
        text: "Reservation cancelled successfully."
      });
      await loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Cancel failed."
      });
    }
  };

  return (
    <section className="page">
      <div className="section-card page-banner">
        <div>
          <p className="eyebrow">Your schedule</p>
          <h2>My reservations</h2>
          <p>Track your upcoming court bookings and manage cancellations.</p>
        </div>
        <div className="banner-metric">
          <span>Active bookings</span>
          <strong>{myReservations.filter(r => r.status !== "CANCELLED").length}</strong>
        </div>
      </div>

      {message.text && (
        <div className={`alert ${message.type === "error" ? "error" : ""}`}>
          {message.text}
        </div>
      )}

      <div className="section-card">
        {myReservations.length === 0 ? (
          <div className="empty-state compact-empty">
            <h3>No reservations yet</h3>
            <p>Your upcoming bookings will appear here.</p>
          </div>
        ) : (
          <div className="list">
            {myReservations.map((reservation) => (
              <div key={reservation.id} className="list-item">
                <div className="card-top">
                  <h3>{reservation.court.name}</h3>
                  <span className={`badge ${reservation.status.toLowerCase()}`}>
                    {reservation.status}
                  </span>
                </div>

                <p>
                  {formatDateTime(reservation.startTime)} -{" "}
                  {new Date(reservation.endTime).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>

                <small>{reservation.type}</small>

                {reservation.status !== "CANCELLED" && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      className="secondary-button"
                      onClick={() => handleCancel(reservation.id)}
                    >
                      Cancel reservation
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MyReservationsPage;
