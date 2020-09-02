module.exports = {
  client: require('ganache-cli'),
  providerOptions: {
    mnemonic: "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
  },
  skipFiles: [
    'Migrations.sol',
    'mocks/',
    'packages/',
    'Controller.sol'
  ]
}