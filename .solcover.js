module.exports = {
  client: require('ganache-cli'),
  providerOptions: {
    mnemonic: "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
  },
  skipFiles: [
    'Migrations.sol',
    'packages/oz/SafeMath.sol',
    'packages/oz/Address.sol',
    'packages/oz/IERC20.sol',
    'packages/oz/Context.sol',
    'packages/oz/Ownable.sol',
    'packages/oz/upgradeability/ContextUpgradeSafe.sol',
    'packages/oz/upgradeability/ERC20Initializable.sol',
    'packages/oz/upgradeability/Initializable.sol',
    'packages/openzeppelin-upgradeability/OwnedUpgradeabilityProxy.sol',
    'packages/openzeppelin-upgradeability/Proxy.sol',
    'packages/openzeppelin-upgradeability/UpgradeabilityProxy.sol',
    'packages/openzeppelin-upgradeability/VersionInitializable.sol'
  ]
}