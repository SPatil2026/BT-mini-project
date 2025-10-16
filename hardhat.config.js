require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
const fs = require('fs');

module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  paths: {
    artifacts: "./artifacts",
  },
};