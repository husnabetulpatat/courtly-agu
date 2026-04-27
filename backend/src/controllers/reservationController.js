const prisma = require("../config/prisma");

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getStartOfDay = (dateText) => {
  const date = new Date(`${dateText}T00:00:00`);
  return date;
};

const getEndOfDay = (dateText) => {
  const date = new Date(`${dateText}T23:59:59`);
  return date;
};

const getWeekRange = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);

  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return {
    start,
    end
  };
};

const checkReservationConflict = async (courtId, startTime, endTime) => {
  const reservationConflict = await prisma.reservation.findFirst({
    where: {
      courtId,
      status: {
        in: ["PENDING", "CONFIRMED"]
      },
      startTime: {
        lt: endTime
      },
      endTime: {
        gt: startTime
      }
    }
  });

  if (reservationConflict) {
    return "This court already has a reservation for this time range";
  }

  const lessonConflict = await prisma.lesson.findFirst({
    where: {
      courtId,
      isActive: true,
      startTime: {
        lt: endTime
      },
      endTime: {
        gt: startTime
      }
    }
  });

  if (lessonConflict) {
    return "This court already has a lesson for this time range";
  }

  return null;
};

const getReservations = async (req, res) => {
  try {
    const { date, courtId } = req.query;

    const where = {};

    if (courtId) {
      where.courtId = Number(courtId);
    }

    if (date) {
      where.startTime = {
        gte: getStartOfDay(date),
        lte: getEndOfDay(date)
      };
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        court: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            tennisLevel: true,
            hasRacket: true
          }
        },
        matchPost: true
      },
      orderBy: {
        startTime: "asc"
      }
    });

    return res.json({
      reservations
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch reservations"
    });
  }
};

const getMyReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        court: true,
        matchPost: true
      },
      orderBy: {
        startTime: "asc"
      }
    });

    return res.json({
      reservations
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch your reservations"
    });
  }
};

const createReservation = async (req, res) => {
  try {
    const { courtId, startTime, endTime, type, note } = req.body;

    if (!courtId || !startTime || !endTime) {
      return res.status(400).json({
        message: "Court, start time and end time are required"
      });
    }

    const parsedStart = parseDate(startTime);
    const parsedEnd = parseDate(endTime);

    if (!parsedStart || !parsedEnd || parsedStart >= parsedEnd) {
      return res.status(400).json({
        message: "Invalid reservation time range"
      });
    }

    if (parsedStart < new Date()) {
      return res.status(400).json({
        message: "Reservation time must be in the future"
      });
    }

    const durationMinutes = (parsedEnd - parsedStart) / 1000 / 60;

    if (durationMinutes < 30 || durationMinutes > 120) {
      return res.status(400).json({
        message: "Reservation duration must be between 30 and 120 minutes"
      });
    }

    const court = await prisma.court.findUnique({
      where: {
        id: Number(courtId)
      }
    });

    if (!court || court.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Court is not available"
      });
    }

    const conflictMessage = await checkReservationConflict(
      Number(courtId),
      parsedStart,
      parsedEnd
    );

    if (conflictMessage) {
      return res.status(409).json({
        message: conflictMessage
      });
    }

    const weekRange = getWeekRange(parsedStart);

    const weeklyReservationCount = await prisma.reservation.count({
      where: {
        userId: req.user.id,
        status: {
          in: ["PENDING", "CONFIRMED"]
        },
        startTime: {
          gte: weekRange.start,
          lt: weekRange.end
        }
      }
    });

    if (weeklyReservationCount >= 3 && req.user.role === "STUDENT") {
      return res.status(400).json({
        message: "Weekly reservation limit reached"
      });
    }

    const reservation = await prisma.reservation.create({
      data: {
        courtId: Number(courtId),
        userId: req.user.id,
        startTime: parsedStart,
        endTime: parsedEnd,
        type: type || "WITH_PARTNER",
        status: "CONFIRMED",
        note: note || null
      },
      include: {
        court: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            tennisLevel: true
          }
        }
      }
    });

    return res.status(201).json({
      message: "Reservation created successfully",
      reservation
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not create reservation"
    });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        matchPost: true
      }
    });

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found"
      });
    }

    const isOwner = reservation.userId === req.user.id;
    const isAdmin = ["ADMIN", "COACH"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You cannot cancel this reservation"
      });
    }

    const updatedReservation = await prisma.reservation.update({
      where: {
        id: Number(id)
      },
      data: {
        status: "CANCELLED"
      }
    });

    if (reservation.matchPost) {
      await prisma.matchPost.update({
        where: {
          id: reservation.matchPost.id
        },
        data: {
          status: "CANCELLED"
        }
      });
    }

    return res.json({
      message: "Reservation cancelled successfully",
      reservation: updatedReservation
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not cancel reservation"
    });
  }
};

const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required"
      });
    }

    const reservation = await prisma.reservation.update({
      where: {
        id: Number(id)
      },
      data: {
        status
      }
    });

    return res.json({
      message: "Reservation status updated successfully",
      reservation
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not update reservation status"
    });
  }
};

module.exports = {
  getReservations,
  getMyReservations,
  createReservation,
  cancelReservation,
  updateReservationStatus
};
