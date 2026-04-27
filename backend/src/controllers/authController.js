const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );
};

const cleanUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      tennisLevel,
      hasRacket,
      bio
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "Full name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || "agu.edu.tr";

    if (!normalizedEmail.endsWith(`@${allowedDomain}`)) {
      return res.status(400).json({
        message: `Only ${allowedDomain} emails are allowed`
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email: normalizedEmail,
        password: hashedPassword,
        role: "STUDENT",
        tennisLevel: tennisLevel || "BEGINNER",
        hasRacket: Boolean(hasRacket),
        bio: bio || null
      }
    });

    const token = createToken(user);

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: cleanUser(user)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Registration failed"
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "This account is inactive"
      });
    }

    const token = createToken(user);

    return res.json({
      message: "Login successful",
      token,
      user: cleanUser(user)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Login failed"
    });
  }
};

const getMe = async (req, res) => {
  return res.json({
    user: req.user
  });
};

const updateProfile = async (req, res) => {
  try {
    const { hasRacket } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        hasRacket: Boolean(hasRacket)
      }
    });

    return res.json({
      message: "Profile updated successfully",
      user: cleanUser(updatedUser)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Profile update failed"
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
