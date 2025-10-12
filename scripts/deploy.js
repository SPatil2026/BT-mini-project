async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const Attendance = await ethers.getContractFactory("Attendance");
  const attendance = await Attendance.deploy();
  await attendance.deployed();

  console.log("Attendance deployed to:", attendance.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});