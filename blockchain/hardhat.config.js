require( "@nomicfoundation/hardhat-toolbox" );
require( "dotenv" ).config(); // Load environment variables from .env file

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545", // Ganache local blockchain URL
      accounts: [ process.env.PRIVATE_KEY ], // Load private key from .env file
    },
  },
};
