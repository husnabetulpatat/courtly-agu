const prisma = require("../config/prisma");

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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
    return "This court already has another lesson for this time range";
  }

  return null;
};

const getLessons = async (req, res) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        isActive: true
      },
      include: {
        court: true,
        applications: true
      },
      orderBy: {
        startTime: "asc"
      }
    });

    return res.json({
      lessons
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch lessons"
    });
  }
};

const createLesson = async (req, res) => {
  try {
    const {
      title,
      description,
      level,
      courtId,
      startTime,
      endTime,
      capacity
    } = req.body;

    if (!title || !courtId || !startTime || !endTime || !capacity) {
      return res.status(400).json({
        message: "Title, court, time range and capacity are required"
      });
    }

    const parsedStart = parseDate(startTime);
    const parsedEnd = parseDate(endTime);

    if (!parsedStart || !parsedEnd || parsedStart >= parsedEnd) {
      return res.status(400).json({
        message: "Invalid lesson time range"
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

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description: description || null,
        level: level || "BEGINNER",
        courtId: Number(courtId),
        startTime: parsedStart,
        endTime: parsedEnd,
        capacity: Number(capacity),
        isActive: true
      },
      include: {
        court: true
      }
    });

    return res.status(201).json({
      message: "Lesson created successfully",
      lesson
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not create lesson"
    });
  }
};

const applyToLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const lesson = await prisma.lesson.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!lesson || !lesson.isActive) {
      return res.status(404).json({
        message: "Lesson not found"
      });
    }

    const existingApplication = await prisma.lessonApplication.findUnique({
      where: {
        lessonId_userId: {
          lessonId: Number(id),
          userId: req.user.id
        }
      }
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "You already applied to this lesson"
      });
    }

    const application = await prisma.lessonApplication.create({
      data: {
        lessonId: Number(id),
        userId: req.user.id,
        status: "PENDING",
        note: note || null
      },
      include: {
        lesson: true,
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
      message: "Lesson application created successfully",
      application
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not apply to lesson"
    });
  }
};

const getMyLessonApplications = async (req, res) => {
  try {
    const applications = await prisma.lessonApplication.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        lesson: {
          include: {
            court: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json({
      applications
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch your lesson applications"
    });
  }
};

const getLessonApplications = async (req, res) => {
  try {
    const { id } = req.params;

    const applications = await prisma.lessonApplication.findMany({
      where: {
        lessonId: Number(id)
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            tennisLevel: true,
            hasRacket: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return res.json({
      applications
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch lesson applications"
    });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required"
      });
    }

    const application = await prisma.lessonApplication.findUnique({
      where: {
        id: Number(applicationId)
      },
      include: {
        lesson: true
      }
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found"
      });
    }

    if (status === "ACCEPTED") {
      const acceptedCount = await prisma.lessonApplication.count({
        where: {
          lessonId: application.lessonId,
          status: "ACCEPTED"
        }
      });

      if (acceptedCount >= application.lesson.capacity) {
        return res.status(400).json({
          message: "Lesson capacity is full"
        });
      }
    }

    const updatedApplication = await prisma.lessonApplication.update({
      where: {
        id: Number(applicationId)
      },
      data: {
        status
      },
      include: {
        lesson: true,
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

    return res.json({
      message: "Application status updated successfully",
      application: updatedApplication
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not update application status"
    });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found"
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.attendanceRecord.deleteMany({
        where: {
          lessonId: Number(id)
        }
      });

      await tx.lessonApplication.deleteMany({
        where: {
          lessonId: Number(id)
        }
      });

      await tx.lesson.delete({
        where: {
          id: Number(id)
        }
      });
    });

    return res.json({
      message: "Lesson deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not delete lesson"
    });
  }
};

module.exports = {
  getLessons,
  createLesson,
  applyToLesson,
  getMyLessonApplications,
  getLessonApplications,
  updateApplicationStatus,
  deleteLesson
};
