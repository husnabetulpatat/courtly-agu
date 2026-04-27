import { useEffect, useState } from "react";
import api from "../api/api";

const ReservationsPage = () => {
  const [courts, setCourts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    courtId: "",
    date: "",
    startHour: "17:00",
    duration: "60",
    type: "WITH_PARTNER",
    note: ""
  });

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  };

  const loadData = async () => {
    try {
      const [courtsRes, reservationsRes, myReservationsRes] = await Promise.all([
        api.get("/courts"),
        api.get("/reservations"),
        api.get("/reservations/my")
      ]);

      setCourts(courtsRes.data.courts);
      setReservations(reservationsRes.data.reservations);
      setMyReservations(myReservationsRes.data.reservations);

      if (!formData.courtId && courtsRes.data.courts.length > 0) {
        updateField("courtId", String(courtsRes.data.courts[0].id));
      }
    } catch (error) {
      console.log("Reservation load error", error);
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

      await api.post("/reservations", {
        courtId: Number(formData.courtId),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        type: formData.type,
        note: formData.note
      });

      setMessage("Reservation created successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Reservation failed.");
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.patch(`/reservations/${id}/cancel`);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Cancel failed.");
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
          <p className="eyebrow">Fair court usage</p>
          <h1>Reservations</h1>
          <p>Create and manage tennis court reservations.</p>
        </div>
      </div>

      <div className="two-column">
        <form onSubmit={handleCreate} className="section-card form">
          <h2>Create reservation</h2>

          {message && <div className="alert">{message}</div>}

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

          <label>Reservation type</label>
          <select
            value={formData.type}
            onChange={(event) => updateField("type", event.target.value)}
          >
            <option value="WITH_PARTNER">With partner</option>
            <option value="LOOKING_FOR_PARTNER">Looking for partner</option>
            <option value="SOLO_PRACTICE">Solo practice</option>
          </select>

          <label>Note</label>
          <textarea
            value={formData.note}
            onChange={(event) => updateField("note", event.target.value)}
          />

          <button type="submit">Create reservation</button>
        </form>

        <div className="section-card">
          <h2>My reservations</h2>

          {myReservations.length === 0 ? (
            <p className="muted">No reservations yet.</p>
          ) : (
            <div className="list">
              {myReservations.map((reservation) => (
                <div key={reservation.id} className="list-item">
                  <h3>{reservation.court.name}</h3>
                  <p>
                    {formatDate(reservation.startTime)} -{" "}
                    {formatDate(reservation.endTime)}
                  </p>
                  <small>{reservation.status}</small>
                  {reservation.status !== "CANCELLED" && (
                    <button
                      className="secondary-button"
                      onClick={() => handleCancel(reservation.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="section-card">
        <h2>All reservations</h2>

        {reservations.length === 0 ? (
          <p className="muted">No reservations found.</p>
        ) : (
          <div className="list">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="list-item horizontal">
                <div>
                  <h3>{reservation.court.name}</h3>
                  <p>{reservation.user.fullName}</p>
                </div>
                <div>
                  <small>{formatDate(reservation.startTime)}</small>
                  <small>{reservation.status}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReservationsPage;
