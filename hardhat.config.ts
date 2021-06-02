/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.6.10',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
}
