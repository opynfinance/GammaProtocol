pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import 'specs/harness/ControllerHarness.sol';

interface ExtendedERC20 {
  function havocTotalSupply(uint256) external;

  function havocVault(
    address owner,
    uint256 vaultId,
    uint256 i,
    uint256 newShortAmount,
    uint256 newLongAmount,
    uint256 newcollateralAmount
  ) external;
}

/**
    An additional harness over the controller to allow checking the no-bankruptcy rules.
 */
contract ControllerHarnessExtra is ControllerHarness {
  function havocVault(
    address owner,
    uint256 vaultId,
    uint256 i,
    uint256 newShortAmount,
    uint256 newLongAmount,
    uint256 newcollateralAmount
  ) external {
    MarginVault.Vault storage vault = cheapGetVault(owner, vaultId);
    vault.shortAmounts[i] = newShortAmount;
    vault.longAmounts[i] = newLongAmount;
    vault.collateralAmounts[i] = newcollateralAmount;
  }

  function havocTotalSpply(address oToken, uint256 newValue) external {
    if (oToken == anOtokenA) ExtendedERC20(anOtokenA).havocTotalSupply(newValue);
    else if (oToken == anOtokenB) ExtendedERC20(anOtokenB).havocTotalSupply(newValue);
  }
}
