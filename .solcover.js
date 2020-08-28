module.exports = {
  client: require('ganache-cli'),
  providerOptions: {
    mnemonic: "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
  },
  skipFiles: [
    'Migrations.sol',
    'mocks/MockAddressBook.sol',
    'mocks/MockOracle.sol',
    'mocks/MockMarginCalculator.sol',
    'packages/oz/SafeMath.sol',
    'packages/oz/Address.sol',
    'packages/oz/Context.sol',
    'packages/oz/IERC20.sol',
    'packages/oz/Ownable.sol',
    'packages/oz/Create2.sol',
    'packages/oz/ReentrancyGuard.sol',
    'packages/oz/upgradeability/ContextUpgradeSafe.sol',
    'packages/oz/upgradeability/ERC20Initializable.sol',
    'packages/oz/upgradeability/Initializable.sol',
    'packages/oz/upgradeability/OwnedUpgradeabilityProxy.sol',
    'packages/oz/upgradeability/Proxy.sol',
    'packages/oz/upgradeability/UpgradeabilityProxy.sol',
    'packages/oz/upgradeability/VersionedInitializable.sol',
    'packages/canonical-weth/WETH9.sol',
    'packages/BokkyPooBahsDateTimeLibrary.sol',
    'packages/oz/SignedSafeMath.sol',
    'Controller.sol'
  ]
}