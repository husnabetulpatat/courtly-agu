const prisma = require("../config/prisma");

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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

const checkCourtConflict = async (courtId, startTime, endTime) => {
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

const getMatchPosts = async (req, res) => {
  try {
    const matchPosts = await prisma.matchPost.findMany({
      where: {
        status: {
          in: ["OPEN", "MATCHED"]
        }
      },
      include: {
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
        court: true,
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
      },
      orderBy: {
        startTime: "asc"
      }
    });

    return res.json({
      matchPosts
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch match posts"
    });
  }
};

const getMyMatchPosts = async (req, res) => {
  try {
    const matchPosts = await prisma.matchPost.findMany({
      where: {
        creatorId: req.user.id
      },
      include: {
        court: true,
        reservation: true,
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
      },
      orderBy: {
        startTime: "asc"
      }
    });

    return res.json({
      matchPosts
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch your match posts"
    });
  }
};

const getMyMatchRequests = async (req, res) => {
  try {
    const requests = await prisma.matchRequest.findMany({
      where: {
        requesterId: req.user.id
      },
      include: {
        matchPost: {
          include: {
            court: true,
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
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json({
      requests
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch your match requests"
    });
  }
};

const createMatchPost = async (req, res) => {
  try {
    const {
      courtId,
      title,
      description,
      preferredLevel,
      startTime,
      endTime
    } = req.body;

    if (!courtId || !title || !startTime || !endTime) {
      return res.status(400).json({
        message: "Court, title, start time and end time are required"
      });
    }

    const parsedStart = parseDate(startTime);
    const parsedEnd = parseDate(endTime);

    if (!parsedStart || !parsedEnd || parsedStart >= parsedEnd) {
      return res.status(400).json({
        message: "Invalid match time range"
      });
    }

    if (parsedStart < new Date()) {
      return res.status(400).json({
        message: "Match time must be in the future"
      });
    }

    const durationMinutes = (parsedEnd - parsedStart) / 1000 / 60;

    if (durationMinutes < 30 || durationMinutes > 120) {
      return res.status(400).json({
        message: "Match duration must be between 30 and 120 minutes"
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

    const weekRange = getWeekRange(parsedStart);

    const weeklyActiveMatchCount = await prisma.matchPost.count({
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

    if (req.user.role === "STUDENT" && weeklyActiveMatchCount >= 2) {
      return res.status(400).json({
        message: "Weekly active match post limit reached. You can create up to 2 active matches per week."
      });
    }

    const conflictMessage = await checkCourtConflict(
      Number(courtId),
      parsedStart,
      parsedEnd
    );

    if (conflictMessage) {
      return res.status(409).json({
        message: conflictMessage
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          courtId: Number(courtId),
          userId: req.user.id,
          startTime: parsedStart,
          endTime: parsedEnd,
          type: "LOOKING_FOR_PARTNER",
          status: "CONFIRMED",
          note: description || null
        }
      });

      const matchPost = await tx.matchPost.create({
        data: {
          creatorId: req.user.id,
          courtId: Number(courtId),
          reservationId: reservation.id,
          title,
          description: description || null,
          preferredLevel: preferredLevel || "BEGINNER",
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
              hasRacket: true
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

      return matchPost;
    });

    return res.status(201).json({
      message: "Match post created successfully",
      matchPost: result
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not create match post"
    });
  }
};

const cancelMatchPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const matchPost = await prisma.matchPost.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        reservation: true,
        requests: {
          include: {
            requester: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!matchPost) {
      return res.status(404).json({
        message: "Match post not found"
      });
    }

    const isOwner = matchPost.creatorId === req.user.id;
    const isAdmin = ["ADMIN", "COACH"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You cannot cancel this match"
      });
    }

    if (matchPost.status === "CANCELLED") {
      return res.status(400).json({
        message: "This match is already cancelled"
      });
    }

    const acceptedRequest = matchPost.requests.find(
      (request) => request.status === "ACCEPTED"
    );

    const cleanReason =
      reason && reason.trim().length > 0
        ? reason.trim()
        : "The match owner cancelled this match.";

    const result = await prisma.$transaction(async (tx) => {
      const updatedMatchPost = await tx.matchPost.update({
        where: {
          id: Number(id)
        },
        data: {
          status: "CANCELLED"
        },
        include: {
          court: true,
          reservation: true,
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

      if (matchPost.reservationId) {
        await tx.reservation.update({
          where: {
            id: matchPost.reservationId
          },
          data: {
            status: "CANCELLED"
          }
        });
      }

      await tx.matchRequest.updateMany({
        where: {
          matchPostId: Number(id),
          status: "PENDING"
        },
        data: {
          status: "CANCELLED"
        }
      });

      if (acceptedRequest) {
        await tx.message.create({
          data: {
            matchPostId: Number(id),
            senderId: req.user.id,
            content: `Match cancelled. Note from ${req.user.fullName}: ${cleanReason}`
          }
        });
      }

      return updatedMatchPost;
    });

    return res.json({
      message: acceptedRequest
        ? "Match cancelled and the accepted partner has been notified in chat."
        : "Match cancelled successfully.",
      matchPost: result
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not cancel match"
    });
  }
};

const requestToJoinMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const matchPost = await prisma.matchPost.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!matchPost || matchPost.status !== "OPEN") {
      return res.status(404).json({
        message: "Open match post not found"
      });
    }

    if (matchPost.creatorId === req.user.id) {
      return res.status(400).json({
        message: "You cannot request to join your own match"
      });
    }

    const existingRequest = await prisma.matchRequest.findUnique({
      where: {
        matchPostId_requesterId: {
          matchPostId: Number(id),
          requesterId: req.user.id
        }
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        message: "You already requested to join this match"
      });
    }

    const request = await prisma.matchRequest.create({
      data: {
        matchPostId: Number(id),
        requesterId: req.user.id,
        status: "PENDING",
        note: note || null
      },
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
    });

    return res.status(201).json({
      message: "Match request sent successfully",
      request
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not send match request"
    });
  }
};

const getMatchRequests = async (req, res) => {
  try {
    const { id } = req.params;

    const matchPost = await prisma.matchPost.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!matchPost) {
      return res.status(404).json({
        message: "Match post not found"
      });
    }

    const isOwner = matchPost.creatorId === req.user.id;
    const isAdmin = ["ADMIN", "COACH"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You cannot view these requests"
      });
    }

    const requests = await prisma.matchRequest.findMany({
      where: {
        matchPostId: Number(id)
      },
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
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return res.json({
      requests
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch match requests"
    });
  }
};

const updateMatchRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!status || !["ACCEPTED", "REJECTED", "CANCELLED"].includes(status)) {
      return res.status(400).json({
        message: "Valid status is required"
      });
    }

    const request = await prisma.matchRequest.findUnique({
      where: {
        id: Number(requestId)
      },
      include: {
        matchPost: true
      }
    });

    if (!request) {
      return res.status(404).json({
        message: "Match request not found"
      });
    }

    if (request.matchPost.status !== "OPEN" && status === "ACCEPTED") {
      return res.status(400).json({
        message: "Only open matches can accept requests"
      });
    }

    const isOwner = request.matchPost.creatorId === req.user.id;
    const isRequester = request.requesterId === req.user.id;

    if (status === "CANCELLED" && !isRequester) {
      return res.status(403).json({
        message: "Only requester can cancel this request"
      });
    }

    if (["ACCEPTED", "REJECTED"].includes(status) && !isOwner) {
      return res.status(403).json({
        message: "Only match owner can accept or reject requests"
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.matchRequest.update({
        where: {
          id: Number(requestId)
        },
        data: {
          status
        },
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
              email: true,
              tennisLevel: true,
              hasRacket: true
            }
          },
          matchPost: true
        }
      });

      if (status === "ACCEPTED") {
        await tx.matchPost.update({
          where: {
            id: request.matchPostId
          },
          data: {
            status: "MATCHED"
          }
        });

        await tx.matchRequest.updateMany({
          where: {
            matchPostId: request.matchPostId,
            id: {
              not: Number(requestId)
            },
            status: "PENDING"
          },
          data: {
            status: "REJECTED"
          }
        });

        await tx.message.create({
          data: {
            matchPostId: request.matchPostId,
            senderId: req.user.id,
            content: `Match confirmed. ${updatedRequest.requester.fullName} has been accepted as the partner.`
          }
        });
      }

      return updatedRequest;
    });

    return res.json({
      message: "Match request status updated successfully",
      request: result
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not update match request status"
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { id } = req.params;

    const matchPost = await prisma.matchPost.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        requests: true
      }
    });

    if (!matchPost) {
      return res.status(404).json({
        message: "Match post not found"
      });
    }

    const isCreator = matchPost.creatorId === req.user.id;
    const isAcceptedRequester = matchPost.requests.some(
      (request) =>
        request.requesterId === req.user.id && request.status === "ACCEPTED"
    );

    if (!isCreator && !isAcceptedRequester) {
      return res.status(403).json({
        message: "Chat is only available after match approval"
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        matchPostId: Number(id)
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return res.json({
      messages
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch messages"
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        message: "Message content is required"
      });
    }

    const matchPost = await prisma.matchPost.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        requests: true
      }
    });

    if (!matchPost) {
      return res.status(404).json({
        message: "Match post not found"
      });
    }

    const isCreator = matchPost.creatorId === req.user.id;
    const isAcceptedRequester = matchPost.requests.some(
      (request) =>
        request.requesterId === req.user.id && request.status === "ACCEPTED"
    );

    if (!isCreator && !isAcceptedRequester) {
      return res.status(403).json({
        message: "Chat is only available after match approval"
      });
    }

    const message = await prisma.message.create({
      data: {
        matchPostId: Number(id),
        senderId: req.user.id,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    return res.status(201).json({
      message: "Message sent successfully",
      data: message
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not send message"
    });
  }
};

module.exports = {
  getMatchPosts,
  getMyMatchPosts,
  getMyMatchRequests,
  createMatchPost,
  cancelMatchPost,
  requestToJoinMatch,
  getMatchRequests,
  updateMatchRequestStatus,
  getMessages,
  sendMessage
};