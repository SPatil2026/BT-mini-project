const { expect } = require("chai");

describe("Attendance", function () {
  let Attendance, attendance, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Attendance = await ethers.getContractFactory("Attendance");
    attendance = await Attendance.deploy();
    await attendance.deployed();
  });

  it("should let owner add and remove students", async function () {
    await attendance.addStudent(addr1.address);
    expect(await attendance.isStudent(addr1.address)).to.equal(true);

    await attendance.removeStudent(addr1.address);
    expect(await attendance.isStudent(addr1.address)).to.equal(false);
  });

  it("should create session and mark attendance", async function () {
    await attendance.addStudent(addr1.address);
    await attendance.addStudent(addr2.address);

    const tx = await attendance.createSession("Math 101 - 2025-10-12");
    const receipt = await tx.wait();

    const sessionId = 1;
    let s = await attendance.getSession(sessionId);
    expect(s.id).to.equal(sessionId);

    await attendance.markAttendance(sessionId, addr1.address);
    expect(await attendance.isPresent(sessionId, addr1.address)).to.equal(true);
    expect(await attendance.getStudentAttendanceCount(addr1.address)).to.equal(1);

    // should revert if marking same student again
    await expect(attendance.markAttendance(sessionId, addr1.address)).to.be.revertedWith("Already marked");
  });

  it("should prevent non-owner from adding students", async function () {
    await expect(attendance.connect(addr1).addStudent(addr2.address)).to.be.reverted;
  });
});