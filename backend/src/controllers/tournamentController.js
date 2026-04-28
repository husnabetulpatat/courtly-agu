const prisma = require("../config/prisma");

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getTournamentMatches = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    const matches = await prisma.tournamentMatch.findMany({
      where,
      include: {
        court: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        startTime: "asc"
      }
    });

    return res.json({
      matches
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch tournament matches"
    });
  }
};

const createTournamentMatch = async (req, res) => {
  try {
    const {
      title,
      playerOneName,
      playerTwoName,
      courtId,
      startTime,
      endTime,
      note
    } = req.body;

    if (!playerOneName || !playerTwoName || !courtId || !startTime) {
      return res.status(400).json({
        message: "Player names, court and start time are required"
      });
    }

    const parsedStart = parseDate(startTime);
    const parsedEnd = endTime ? parseDate(endTime) : null;

    if (!parsedStart) {
      return res.status(400).json({
        message: "Invalid start time"
      });
    }

    if (parsedEnd && parsedEnd <= parsedStart) {
      return res.status(400).json({
        message: "End time must be after start time"
      });
    }

    const court = await prisma.court.findUnique({
      where: {
        id: Number(courtId)
      }
    });

    if (!court) {
      return res.status(404).json({
        message: "Court not found"
      });
    }

    const match = await prisma.tournamentMatch.create({
      data: {
        title: title || null,
        playerOneName,
        playerTwoName,
        courtId: Number(courtId),
        startTime: parsedStart,
        endTime: parsedEnd,
        note: note || null,
        status: "SCHEDULED",
        createdById: req.user.id
      },
      include: {
        court: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(201).json({
      message: "Tournament match created successfully",
      match
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not create tournament match"
    });
  }
};

const updateTournamentMatch = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      playerOneName,
      playerTwoName,
      courtId,
      startTime,
      endTime,
      status,
      score,
      winnerName,
      note
    } = req.body;

    const existingMatch = await prisma.tournamentMatch.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!existingMatch) {
      return res.status(404).json({
        message: "Tournament match not found"
      });
    }

    const allowedStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED"];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid tournament match status"
      });
    }

    const parsedStart = startTime ? parseDate(startTime) : undefined;
    const parsedEnd = endTime ? parseDate(endTime) : undefined;

    if (startTime && !parsedStart) {
      return res.status(400).json({
        message: "Invalid start time"
      });
    }

    if (endTime && !parsedEnd) {
      return res.status(400).json({
        message: "Invalid end time"
      });
    }

    const match = await prisma.tournamentMatch.update({
      where: {
        id: Number(id)
      },
      data: {
        ...(title !== undefined && { title: title || null }),
        ...(playerOneName !== undefined && { playerOneName }),
        ...(playerTwoName !== undefined && { playerTwoName }),
        ...(courtId !== undefined && { courtId: Number(courtId) }),
        ...(startTime !== undefined && { startTime: parsedStart }),
        ...(endTime !== undefined && { endTime: parsedEnd || null }),
        ...(status !== undefined && { status }),
        ...(score !== undefined && { score: score || null }),
        ...(winnerName !== undefined && { winnerName: winnerName || null }),
        ...(note !== undefined && { note: note || null })
      },
      include: {
        court: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.json({
      message: "Tournament match updated successfully",
      match
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not update tournament match"
    });
  }
};

const deleteTournamentMatch = async (req, res) => {
  try {
    const { id } = req.params;

    const existingMatch = await prisma.tournamentMatch.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!existingMatch) {
      return res.status(404).json({
        message: "Tournament match not found"
      });
    }

    await prisma.tournamentMatch.delete({
      where: {
        id: Number(id)
      }
    });

    return res.json({
      message: "Tournament match deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not delete tournament match"
    });
  }
};

module.exports = {
  getTournamentMatches,
  createTournamentMatch,
  updateTournamentMatch,
  deleteTournamentMatch
};