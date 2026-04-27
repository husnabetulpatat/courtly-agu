const prisma = require("../config/prisma");

const getCourts = async (req, res) => {
  try {
    const courts = await prisma.court.findMany({
      orderBy: {
        id: "asc"
      }
    });

    return res.json({
      courts
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch courts"
    });
  }
};

const createCourt = async (req, res) => {
  try {
    const { name, description, location, status } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Court name is required"
      });
    }

    const court = await prisma.court.create({
      data: {
        name,
        description: description || null,
        location: location || null,
        status: status || "ACTIVE"
      }
    });

    return res.status(201).json({
      message: "Court created successfully",
      court
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not create court"
    });
  }
};

const updateCourt = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location, status } = req.body;

    const court = await prisma.court.update({
      where: {
        id: Number(id)
      },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(status !== undefined && { status })
      }
    });

    return res.json({
      message: "Court updated successfully",
      court
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not update court"
    });
  }
};

module.exports = {
  getCourts,
  createCourt,
  updateCourt
};
