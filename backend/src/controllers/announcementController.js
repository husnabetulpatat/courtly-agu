const prisma = require("../config/prisma");

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        isPublished: true
      },
      include: {
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
        createdAt: "desc"
      }
    });

    return res.json({
      announcements
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch announcements"
    });
  }
};

const getAdminAnnouncements = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      include: {
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
        createdAt: "desc"
      }
    });

    return res.json({
      announcements
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch admin announcements"
    });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, target, isPublished } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required"
      });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        target: target || "ALL_USERS",
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
        createdById: req.user.id
      },
      include: {
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
      message: "Announcement created successfully",
      announcement
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not create announcement"
    });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

    await prisma.announcement.delete({
      where: {
        id: Number(id)
      }
    });

    return res.json({
      message: "Announcement deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not delete announcement"
    });
  }
};

module.exports = {
  getAnnouncements,
  getAdminAnnouncements,
  createAnnouncement,
  deleteAnnouncement
};