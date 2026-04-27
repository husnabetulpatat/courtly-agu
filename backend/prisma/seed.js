const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.message.deleteMany();
  await prisma.matchRequest.deleteMany();
  await prisma.matchPost.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.lessonApplication.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.court.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.create({
    data: {
      fullName: "AGU Tennis Admin",
      email: "admin@agu.edu.tr",
      password: hashedPassword,
      role: "ADMIN",
      tennisLevel: "INTERMEDIATE",
      hasRacket: true,
      bio: "System admin for AGU Tennis Platform"
    }
  });

  const studentOne = await prisma.user.create({
    data: {
      fullName: "Husna Betul Patat",
      email: "husna@agu.edu.tr",
      password: hashedPassword,
      role: "STUDENT",
      tennisLevel: "BEGINNER",
      hasRacket: false,
      bio: "Beginner student who wants to start playing tennis."
    }
  });

  const studentTwo = await prisma.user.create({
    data: {
      fullName: "Demo Student",
      email: "student@agu.edu.tr",
      password: hashedPassword,
      role: "STUDENT",
      tennisLevel: "BEGINNER_PLUS",
      hasRacket: true,
      bio: "Looking for beginner friendly tennis matches."
    }
  });

  const courtOne = await prisma.court.create({
    data: {
      name: "Court 1",
      description: "Main tennis court on campus.",
      location: "AGU Sports Area",
      status: "ACTIVE"
    }
  });

  const courtTwo = await prisma.court.create({
    data: {
      name: "Court 2",
      description: "Second court area. Tennis availability can be configured by admin.",
      location: "AGU Sports Area",
      status: "ACTIVE"
    }
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(17, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(18, 0, 0, 0);

  const lesson = await prisma.lesson.create({
    data: {
      title: "Beginner Tennis Lesson",
      description: "Introductory tennis lesson for students who are new to tennis.",
      level: "BEGINNER",
      courtId: courtOne.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      capacity: 8,
      isActive: true
    }
  });

  await prisma.lessonApplication.create({
    data: {
      lessonId: lesson.id,
      userId: studentOne.id,
      status: "PENDING",
      note: "I want to start tennis as a beginner."
    }
  });

  const reservationStart = new Date();
  reservationStart.setDate(reservationStart.getDate() + 2);
  reservationStart.setHours(16, 0, 0, 0);

  const reservationEnd = new Date(reservationStart);
  reservationEnd.setHours(17, 0, 0, 0);

  const reservation = await prisma.reservation.create({
    data: {
      courtId: courtTwo.id,
      userId: studentOne.id,
      startTime: reservationStart,
      endTime: reservationEnd,
      type: "LOOKING_FOR_PARTNER",
      status: "CONFIRMED",
      note: "Beginner friendly practice session."
    }
  });

  const matchPost = await prisma.matchPost.create({
    data: {
      creatorId: studentOne.id,
      courtId: courtTwo.id,
      reservationId: reservation.id,
      title: "Looking for a beginner tennis partner",
      description: "I am new to tennis and want to practice with another beginner student.",
      preferredLevel: "BEGINNER",
      startTime: reservationStart,
      endTime: reservationEnd,
      status: "OPEN"
    }
  });

  await prisma.matchRequest.create({
    data: {
      matchPostId: matchPost.id,
      requesterId: studentTwo.id,
      status: "PENDING",
      note: "I would like to join this match."
    }
  });

  await prisma.announcement.create({
    data: {
      title: "Welcome to AGU Tennis Platform",
      content: "Court reservations, tennis lessons and beginner friendly matches will be managed here.",
      target: "ALL_USERS",
      isPublished: true,
      createdById: admin.id
    }
  });

  console.log("Database seeded successfully.");
  console.log("Demo accounts:");
  console.log("Admin: admin@agu.edu.tr / 123456");
  console.log("Student: husna@agu.edu.tr / 123456");
  console.log("Student: student@agu.edu.tr / 123456");
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });