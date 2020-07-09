module.exports = {
  client: require('ganache-cli'),
  providerOptions: {
    mnemonic: "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
  },
  skipFiles: [
    'Migrations.sol',
    'lib/oz/SafeMath.sol',
    'lib/oz/Address.sol',
    'lib/oz/Context.sol',
    'lib/oz/IERC20.sol',
    'lib/oz/ERC20Initializable.sol',
    'lib/oz/Initializable.sol'
  ]
}