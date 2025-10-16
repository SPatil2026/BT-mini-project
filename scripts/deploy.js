const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const Attendance = await ethers.getContractFactory("Attendance");
  const attendance = await Attendance.deploy();
  await attendance.deployed();

  console.log("Attendance deployed to:", attendance.address);

  // Auto-update frontend with contract address
  const frontendPath = path.join(__dirname, '../frontend/src/App.jsx');
  if (fs.existsSync(frontendPath)) {
    let content = fs.readFileSync(frontendPath, 'utf8');
    content = content.replace(
      /const CONTRACT_ADDRESS = ".*";/,
      `const CONTRACT_ADDRESS = "${attendance.address}";`
    );
    fs.writeFileSync(frontendPath, content);
    console.log("✅ Frontend updated with contract address");
  }

  // Save deployment info
  const deploymentInfo = {
    contractAddress: attendance.address,
    deployer: deployer.address,
    network: network.name,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("✅ Deployment info saved to deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});