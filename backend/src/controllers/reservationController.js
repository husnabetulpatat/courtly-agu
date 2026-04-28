const prisma = require("../config/prisma");

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getStartOfDay = (dateText) => {
  return new Date(`${dateText}T00:00:00`);
};

const getEndOfDay = (dateText) => {
  return new Date(`${dateText}T23:59:59`);
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
        matchPost: {
          include: {
            requests: {
              include: {
                requester: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    tennisLevel: true,
                    hasRacket: true
                  }
                }
              }
            }
          }
        }
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
        matchPost: {
          include: {
            requests: {
              include: {
                requester: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    tennisLevel: true,
                    hasRacket: true,
                    bio: true
                  }
                }
              }
            }
          }
        }
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
    const {
      courtId,
      startTime,
      endTime,
      type,
      note,
      matchTitle,
      matchDescription,
      preferredLevel
    } = req.body;

    if (!courtId || !startTime || !endTime) {
      return res.status(400).json({
        message: "Court, start time and end time are required"
      });
    }

    const reservationType = type || "WITH_PARTNER";

    if (
      !["WITH_PARTNER", "LOOKING_FOR_PARTNER", "SOLO_PRACTICE"].includes(
        reservationType
      )
    ) {
      return res.status(400).json({
        message: "Invalid reservation type"
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

    if (req.user.role === "STUDENT" && weeklyReservationCount >= 2) {
      return res.status(400).json({
        message: "Weekly reservation limit reached. You can create up to 2 active reservations per week."
      });
    }

    const sameDayReservationCount = await prisma.reservation.count({
      where: {
        userId: req.user.id,
        status: {
          in: ["PENDING", "CONFIRMED"]
        },
        startTime: {
          gte: getStartOfDay(parsedStart.toISOString().split("T")[0]),
          lte: getEndOfDay(parsedStart.toISOString().split("T")[0])
        }
      }
    });

    if (req.user.role === "STUDENT" && sameDayReservationCount >= 1) {
      return res.status(400).json({
        message: "Daily reservation limit reached. You can create only 1 active reservation per day."
      });
    }

    if (reservationType === "LOOKING_FOR_PARTNER") {
      const weeklyPartnerSearchCount = await prisma.matchPost.count({
        where: {
          creatorId: req.user.id,
          status: {
            in: ["OPEN", "MATCHED"]
          },
          startTime: {
            gte: weekRange.start,
            lt: weekRange.end
          }
        }
      });

      if (req.user.role === "STUDENT" && weeklyPartnerSearchCount >= 1) {
        return res.status(400).json({
          message: "Weekly partner search limit reached. You can create 1 active partner-search match per week."
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          courtId: Number(courtId),
          userId: req.user.id,
          startTime: parsedStart,
          endTime: parsedEnd,
          type: reservationType,
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
              tennisLevel: true,
              hasRacket: true
            }
          }
        }
      });

      let createdMatchPost = null;

      if (reservationType === "LOOKING_FOR_PARTNER") {
        createdMatchPost = await tx.matchPost.create({
          data: {
            creatorId: req.user.id,
            courtId: Number(courtId),
            reservationId: reservation.id,
            title:
              matchTitle ||
              `Looking for a ${preferredLevel || req.user.tennisLevel} tennis partner`,
            description: matchDescription || note || null,
            preferredLevel: preferredLevel || req.user.tennisLevel || "BEGINNER",
            startTime: parsedStart,
            endTime: parsedEnd,
            status: "OPEN"
          },
          include: {
            court: true,
            reservation: true,
            creator: {
              select: {
                id: true,
                fullName: true,
                email: true,
                tennisLevel: true,
                hasRacket: true,
                bio: true
              }
            },
            requests: {
              include: {
                requester: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    tennisLevel: true,
                    hasRacket: true,
                    bio: true
                  }
                }
              }
            }
          }
        });
      }

      return {
        reservation,
        matchPost: createdMatchPost
      };
    });

    return res.status(201).json({
      message:
        reservationType === "LOOKING_FOR_PARTNER"
          ? "Reservation created and partner-search match post published successfully."
          : "Reservation created successfully.",
      reservation: result.reservation,
      matchPost: result.matchPost
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
    const { reason } = req.body;

    const reservation = await prisma.reservation.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        matchPost: {
          include: {
            requests: true
          }
        }
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

    if (reservation.status === "CANCELLED") {
      return res.status(400).json({
        message: "This reservation is already cancelled"
      });
    }

    const cleanReason =
      reason && reason.trim().length > 0
        ? reason.trim()
        : "The reservation owner cancelled this session.";

    const result = await prisma.$transaction(async (tx) => {
      const updatedReservation = await tx.reservation.update({
        where: {
          id: Number(id)
        },
        data: {
          status: "CANCELLED"
        },
        include: {
          court: true,
          matchPost: {
            include: {
              requests: true
            }
          }
        }
      });

      if (reservation.matchPost) {
        const acceptedRequest = reservation.matchPost.requests.find(
          (request) => request.status === "ACCEPTED"
        );

        await tx.matchPost.update({
          where: {
            id: reservation.matchPost.id
          },
          data: {
            status: "CANCELLED"
          }
        });

        await tx.matchRequest.updateMany({
          where: {
            matchPostId: reservation.matchPost.id,
            status: "PENDING"
          },
          data: {
            status: "CANCELLED"
          }
        });

        if (acceptedRequest) {
          await tx.message.create({
            data: {
              matchPostId: reservation.matchPost.id,
              senderId: req.user.id,
              content: `Reservation and match cancelled. Note from ${req.user.fullName}: ${cleanReason}`
            }
          });
        }
      }

      return updatedReservation;
    });

    return res.json({
      message: reservation.matchPost
        ? "Reservation cancelled and linked match post updated successfully."
        : "Reservation cancelled successfully.",
      reservation: result
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

    const allowedStatuses = [
      "PENDING",
      "CONFIRMED",
      "CANCELLED",
      "COMPLETED",
      "NO_SHOW"
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Valid status is required"
      });
    }

    const reservation = await prisma.reservation.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        matchPost: {
          include: {
            requests: true
          }
        }
      }
    });

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found"
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedReservation = await tx.reservation.update({
        where: {
          id: Number(id)
        },
        data: {
          status
        },
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
          matchPost: {
            include: {
              requests: {
                include: {
                  requester: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      tennisLevel: true,
                      hasRacket: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (reservation.matchPost) {
        if (status === "CANCELLED") {
          const acceptedRequest = reservation.matchPost.requests.find(
            (request) => request.status === "ACCEPTED"
          );

          await tx.matchPost.update({
            where: {
              id: reservation.matchPost.id
            },
            data: {
              status: "CANCELLED"
            }
          });

          await tx.matchRequest.updateMany({
            where: {
              matchPostId: reservation.matchPost.id,
              status: "PENDING"
            },
            data: {
              status: "CANCELLED"
            }
          });

          if (acceptedRequest) {
            await tx.message.create({
              data: {
                matchPostId: reservation.matchPost.id,
                senderId: req.user.id,
                content: `Reservation and linked match were cancelled by admin.`
              }
            });
          }
        }

        if (status === "COMPLETED") {
          await tx.matchPost.update({
            where: {
              id: reservation.matchPost.id
            },
            data: {
              status: "COMPLETED"
            }
          });
        }

        if (status === "NO_SHOW") {
          await tx.matchPost.update({
            where: {
              id: reservation.matchPost.id
            },
            data: {
              status: "CANCELLED"
            }
          });

          await tx.matchRequest.updateMany({
            where: {
              matchPostId: reservation.matchPost.id,
              status: "PENDING"
            },
            data: {
              status: "CANCELLED"
            }
          });
        }
      }

      return updatedReservation;
    });

    return res.json({
      message: "Reservation status updated successfully",
      reservation: result
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