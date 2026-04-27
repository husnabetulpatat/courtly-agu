import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 22;
const SLOT_INTERVAL_MINUTES = 30;

const getDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTomorrowDateValue = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return getDateValue(date);
};

const getDayLabel = (dateValue) => {
  return new Date(`${dateValue}T12:00:00`).toLocaleDateString("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
};

const getDateOptions = () => {
  const options = [];

  for (let index = 1; index <= 14; index++) {
    const date = new Date();
    date.setDate(date.getDate() + index);

    options.push({
      value: getDateValue(date),
      label: getDayLabel(getDateValue(date))
    });
  }

  return options;
};

const createLocalDateTime = (dateValue, timeValue) => {
  return new Date(`${dateValue}T${timeValue}:00`);
};

const formatHour = (date) => {
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatDateTime = (dateText) => {
  return new Date(dateText).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

const overlaps = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

const ReservationsPage = () => {
  const [courts, setCourts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [message, setMessage] = useState({
    type: "",
    text: ""
  });

  const [selectedDate, setSelectedDate] = useState(getTomorrowDateValue());
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [reservationType, setReservationType] = useState("WITH_PARTNER");
  const [note, setNote] = useState("");

  const dateOptions = useMemo(() => getDateOptions(), []);

  const selectedCourt = useMemo(() => {
    return courts.find((court) => String(court.id) === String(selectedCourtId));
  }, [courts, selectedCourtId]);

  const loadData = async (dateValue = selectedDate) => {
    try {
      const [courtsRes, reservationsRes, lessonsRes] =
        await Promise.all([
          api.get("/courts"),
          api.get("/reservations", {
            params: dateValue ? { date: dateValue } : {}
          }),
          api.get("/lessons")
        ]);

      const loadedCourts = courtsRes.data.courts;
      setCourts(loadedCourts);
      setReservations(reservationsRes.data.reservations);
      setLessons(lessonsRes.data.lessons);

      if (!selectedCourtId && loadedCourts.length > 0) {
        setSelectedCourtId(String(loadedCourts[0].id));
      }
    } catch (error) {
      console.log("Reservation load error", error);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, []);

  useEffect(() => {
    setSelectedStartTime("");
    loadData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setSelectedStartTime("");
  }, [selectedCourtId, duration]);

  const blockedItems = useMemo(() => {
    const activeReservations = reservations
      .filter((reservation) => {
        return (
          String(reservation.courtId) === String(selectedCourtId) &&
          ["PENDING", "CONFIRMED"].includes(reservation.status)
        );
      })
      .map((reservation) => ({
        id: `reservation-${reservation.id}`,
        type: "Reservation",
        title: reservation.user?.fullName || "Reserved",
        startTime: new Date(reservation.startTime),
        endTime: new Date(reservation.endTime)
      }));

    const activeLessons = lessons
      .filter((lesson) => {
        const lessonDate = getDateValue(new Date(lesson.startTime));

        return (
          String(lesson.courtId) === String(selectedCourtId) &&
          lesson.isActive &&
          lessonDate === selectedDate
        );
      })
      .map((lesson) => ({
        id: `lesson-${lesson.id}`,
        type: "Lesson",
        title: lesson.title,
        startTime: new Date(lesson.startTime),
        endTime: new Date(lesson.endTime)
      }));

    return [...activeReservations, ...activeLessons];
  }, [reservations, lessons, selectedCourtId, selectedDate]);

  const slots = useMemo(() => {
    const generatedSlots = [];
    const selectedDuration = Number(duration);

    for (
      let minutes = SLOT_START_HOUR * 60;
      minutes < SLOT_END_HOUR * 60;
      minutes += SLOT_INTERVAL_MINUTES
    ) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;

      const timeValue = `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;

      const slotStart = createLocalDateTime(selectedDate, timeValue);
      const slotEnd = new Date(slotStart.getTime() + selectedDuration * 60 * 1000);

      const isPast = slotStart < new Date();
      const exceedsDayEnd =
        slotEnd >
        createLocalDateTime(
          selectedDate,
          `${String(SLOT_END_HOUR).padStart(2, "0")}:00`
        );

      const blockingItem = blockedItems.find((item) =>
        overlaps(slotStart, slotEnd, item.startTime, item.endTime)
      );

      generatedSlots.push({
        timeValue,
        label: `${formatHour(slotStart)} - ${formatHour(slotEnd)}`,
        start: slotStart,
        end: slotEnd,
        disabled: isPast || exceedsDayEnd || Boolean(blockingItem),
        reason: isPast
          ? "Past"
          : exceedsDayEnd
          ? "Too late"
          : blockingItem
          ? blockingItem.type
          : "",
        blockingTitle: blockingItem?.title || ""
      });
    }

    return generatedSlots;
  }, [selectedDate, duration, blockedItems]);

  const selectedSlot = useMemo(() => {
    return slots.find((slot) => slot.timeValue === selectedStartTime);
  }, [slots, selectedStartTime]);

  const handleCreate = async () => {
    try {
      setMessage({
        type: "",
        text: ""
      });

      if (!selectedCourtId || !selectedDate || !selectedSlot) {
        setMessage({
          type: "error",
          text: "Please select a court, date and available time slot."
        });
        return;
      }

      await api.post("/reservations", {
        courtId: Number(selectedCourtId),
        startTime: selectedSlot.start.toISOString(),
        endTime: selectedSlot.end.toISOString(),
        type: reservationType,
        note
      });

      setMessage({
        type: "success",
        text: "Reservation created successfully."
      });

      setSelectedStartTime("");
      setNote("");

      await loadData(selectedDate);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Reservation failed."
      });
    }
  };



  const selectedDayReservations = reservations.filter((reservation) => {
    return String(reservation.courtId) === String(selectedCourtId);
  });

  return (
    <section className="page">
      <div className="section-card page-banner">
        <div>
          <p className="eyebrow">Slot-based booking</p>
          <h2>Reserve your court with confidence</h2>
          <p>
            Pick a date, choose a court and select one of the available time
            slots. Lessons and existing reservations are automatically blocked.
          </p>
        </div>


      </div>

      {message.text && (
        <div className={`alert ${message.type === "error" ? "error" : ""}`}>
          {message.text}
        </div>
      )}

      <div className="booking-layout">
        <div className="section-card booking-control-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 1</p>
              <h2>Choose date</h2>
            </div>
          </div>

          <div className="date-strip">
            {dateOptions.map((dateOption) => (
              <button
                key={dateOption.value}
                className={`date-chip ${
                  selectedDate === dateOption.value ? "date-chip-active" : ""
                }`}
                onClick={() => setSelectedDate(dateOption.value)}
                type="button"
              >
                {dateOption.label}
              </button>
            ))}
          </div>

          <label className="manual-date-label">Or select another date</label>
          <input
            type="date"
            min={getTomorrowDateValue()}
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />

          <div className="divider-line" />

          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 2</p>
              <h2>Choose court</h2>
            </div>
          </div>

          <div className="court-tabs">
            {courts.map((court) => (
              <button
                key={court.id}
                type="button"
                className={`court-tab ${
                  String(selectedCourtId) === String(court.id)
                    ? "court-tab-active"
                    : ""
                }`}
                onClick={() => setSelectedCourtId(String(court.id))}
                disabled={court.status !== "ACTIVE"}
              >
                <span>{court.name}</span>
                <small>{court.status}</small>
              </button>
            ))}
          </div>

          {selectedCourt && (
            <div className="selected-court-note">
              <strong>{selectedCourt.name}</strong>
              <p>{selectedCourt.description}</p>
            </div>
          )}

          <div className="divider-line" />

          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 3</p>
              <h2>Session details</h2>
            </div>
          </div>

          <div className="inline-form-row">
            <div>
              <label>Duration</label>
              <select
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              >
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>

            <div>
              <label>Reservation type</label>
              <select
                value={reservationType}
                onChange={(event) => setReservationType(event.target.value)}
              >
                <option value="WITH_PARTNER">With partner</option>
                <option value="LOOKING_FOR_PARTNER">Looking for partner</option>
                <option value="SOLO_PRACTICE">Solo practice</option>
              </select>
            </div>
          </div>

          <label>Note</label>
          <textarea
            placeholder="Optional note about your session..."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />

          <p className="helper-text">
            Tip: use “Looking for partner” if you plan to create a match post or
            want to connect with another student later.
          </p>
        </div>

        <div className="section-card slot-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 4</p>
              <h2>Pick an available time</h2>
            </div>

            <span className="soft-pill">{getDayLabel(selectedDate)}</span>
          </div>

          <div className="slot-legend">
            <span>
              <i className="legend-dot available-dot" /> Available
            </span>
            <span>
              <i className="legend-dot blocked-dot" /> Blocked
            </span>
            <span>
              <i className="legend-dot selected-dot" /> Selected
            </span>
          </div>

          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                key={slot.timeValue}
                type="button"
                disabled={slot.disabled}
                className={`slot-button ${
                  selectedStartTime === slot.timeValue ? "slot-selected" : ""
                } ${slot.disabled ? "slot-disabled" : ""}`}
                onClick={() => setSelectedStartTime(slot.timeValue)}
              >
                <strong>{slot.label}</strong>
                {slot.disabled ? (
                  <small>
                    {slot.reason}
                    {slot.blockingTitle ? ` · ${slot.blockingTitle}` : ""}
                  </small>
                ) : (
                  <small>Available</small>
                )}
              </button>
            ))}
          </div>

          <div className="booking-summary">
            <div>
              <p className="eyebrow">Summary</p>
              <h3>
                {selectedSlot
                  ? `${selectedCourt?.name} · ${selectedSlot.label}`
                  : "No slot selected"}
              </h3>
              <p>
                {selectedSlot
                  ? `${getDayLabel(selectedDate)} / ${duration} minutes / ${reservationType}`
                  : "Choose an available slot to continue."}
              </p>
            </div>

            <button onClick={handleCreate} disabled={!selectedSlot}>
              Confirm reservation
            </button>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selected court day</p>
            <h2>{selectedCourt?.name || "Court"} overview</h2>
          </div>

          <button
            className="secondary-button"
            onClick={() => loadData(selectedDate)}
          >
            Refresh
          </button>
        </div>

        {blockedItems.length === 0 ? (
          <div className="empty-state compact-empty">
            <h3>This day is open</h3>
            <p>No active reservations or lessons are blocking this court.</p>
          </div>
        ) : (
          <div className="list">
            {blockedItems.map((item) => (
              <div key={item.id} className="list-item horizontal reservation-row">
                <div>
                  <h3>{item.type}</h3>
                  <p>{item.title}</p>
                </div>

                <div className="reservation-meta">
                  <small>
                    {formatHour(item.startTime)} - {formatHour(item.endTime)}
                  </small>
                  <span className="badge confirmed">Blocked</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedDayReservations.length > 0 && (
          <div className="micro-note">
            Showing active reservations for the selected court and selected day.
          </div>
        )}
      </div>
    </section>
  );
};

export default ReservationsPage;
