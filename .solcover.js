module.exports = {
  client: require('ganache-cli'),
  providerOptions: {
    mnemonic: "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
  },
  skipFiles: [
    'Migrations.sol',
    'packages/oz/upgradeability/SafeMath.sol',
    'packages/oz/upgradeability/Address.sol',
    'packages/oz/upgradeability/ContextUpgradeSafe.sol',
    'packages/oz/upgradeability/IERC20.sol',
    'packages/oz/upgradeability/ERC20Initializable.sol',
    'packages/oz/upgradeability/Initializable.sol',
    'packages/oz/Context.sol',
    'packages/oz/Ownable.sol'
  ]
}