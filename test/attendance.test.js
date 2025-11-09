const { expect } = require("chai");

describe("Attendance", function () {
  let Attendance, attendance, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Attendance = await ethers.getContractFactory("Attendance");
    attendance = await Attendance.deploy();
    await attendance.deployed();
  });

  it("should register students and teachers", async function () {
    await attendance.registerStudent("John Doe");
    await attendance.registerTeacher("Prof. Smith");
    
    const student = await attendance.getStudent("John Doe");
    const teacher = await attendance.getTeacher("Prof. Smith");
    
    expect(student.isRegistered).to.equal(true);
    expect(teacher.isRegistered).to.equal(true);
  });

  it("should create session with teacher and mark attendance", async function () {
    await attendance.registerStudent("John Doe");
    await attendance.registerStudent("Jane Smith");
    await attendance.registerTeacher("Prof. Johnson");

    await attendance.createSession("Math 101 - 2025-10-12", "Prof. Johnson");

    const sessionId = 1;
    let session = await attendance.getSession(sessionId);
    expect(session.id).to.equal(sessionId);
    expect(session.name).to.equal("Math 101 - 2025-10-12");
    expect(session.teacherName).to.equal("Prof. Johnson");

    await attendance.markAttendance(sessionId, "John Doe");
    expect(await attendance.isPresent(sessionId, "John Doe")).to.equal(true);

    // should revert if marking same student again
    await expect(attendance.markAttendance(sessionId, "John Doe")).to.be.revertedWith("Already marked");
  });

  it("should prevent creating session with unregistered teacher", async function () {
    await expect(attendance.createSession("Math 101", "Unknown Teacher")).to.be.revertedWith("Teacher not registered");
  });

  it("should prevent duplicate registrations", async function () {
    await attendance.registerStudent("John Doe");
    await attendance.registerTeacher("Prof. Smith");
    
    await expect(attendance.registerStudent("John Doe")).to.be.revertedWith("Student already registered");
    await expect(attendance.registerTeacher("Prof. Smith")).to.be.revertedWith("Teacher already registered");
  });
});