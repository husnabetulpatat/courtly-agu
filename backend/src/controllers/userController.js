const prisma = require("../config/prisma");

const getAdminUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        tennisLevel: true,
        hasRacket: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [
          reservationCount,
          activeReservationCount,
          noShowCount,
          lessonApplicationCount,
          matchPostCount
        ] = await Promise.all([
          prisma.reservation.count({
            where: {
              userId: user.id
            }
          }),
          prisma.reservation.count({
            where: {
              userId: user.id,
              status: {
                in: ["PENDING", "CONFIRMED"]
              }
            }
          }),
          prisma.reservation.count({
            where: {
              userId: user.id,
              status: "NO_SHOW"
            }
          }),
          prisma.lessonApplication.count({
            where: {
              userId: user.id
            }
          }),
          prisma.matchPost.count({
            where: {
              creatorId: user.id
            }
          })
        ]);

        return {
          ...user,
          stats: {
            reservationCount,
            activeReservationCount,
            noShowCount,
            lessonApplicationCount,
            matchPostCount
          }
        };
      })
    );

    return res.json({
      users: usersWithStats
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch users"
    });
  }
};

const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, tennisLevel, hasRacket, isActive } = req.body;

    const userId = Number(id);

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (userId === req.user.id && isActive === false) {
      return res.status(400).json({
        message: "You cannot deactivate your own account"
      });
    }

    const allowedRoles = ["STUDENT", "COACH", "ADMIN"];
    const allowedLevels = [
      "BEGINNER",
      "BEGINNER_PLUS",
      "INTERMEDIATE",
      "ADVANCED"
    ];

    if (role !== undefined && !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }

    if (tennisLevel !== undefined && !allowedLevels.includes(tennisLevel)) {
      return res.status(400).json({
        message: "Invalid tennis level"
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        ...(role !== undefined && { role }),
        ...(tennisLevel !== undefined && { tennisLevel }),
        ...(hasRacket !== undefined && { hasRacket: Boolean(hasRacket) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        tennisLevel: true,
        hasRacket: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not update user"
    });
  }
};

module.exports = {
  getAdminUsers,
  updateAdminUser
};
