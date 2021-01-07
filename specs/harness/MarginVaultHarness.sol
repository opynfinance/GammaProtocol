pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import {MarginVault} from '../../contracts/libs/MarginVault.sol';
import {SafeMath} from '../../contracts/packages/oz/SafeMath.sol';

contract MarginVaultHarness {
  using MarginVault for MarginVault.Vault;
  using SafeMath for uint256;

  MarginVault.Vault vault;

  function addShort(
    address _shortOtoken,
    uint256 _amount,
    uint256 _index
  ) external {
    // require(_shortOtoken != address(0)); //add this to avoid violations
    return vault.addShort(_shortOtoken, _amount, _index);
  }

  function removeShort(
    address _shortOtoken,
    uint256 _amount,
    uint256 _index
  ) external {
    return vault.removeShort(_shortOtoken, _amount, _index);
  }

  function addLong(
    address _longOtoken,
    uint256 _amount,
    uint256 _index
  ) external {
    // require(_longOtoken != address(0)); //add this to avoid violations
    return vault.addLong(_longOtoken, _amount, _index);
  }

  function removeLong(
    address _longOtoken,
    uint256 _amount,
    uint256 _index
  ) external {
    return vault.removeLong(_longOtoken, _amount, _index);
  }

  function addCollateral(
    address _collateralAsset,
    uint256 _amount,
    uint256 _index
  ) external {
    // require (_collateralAsset != address(0)); //add this to avoid violations
    return vault.addCollateral(_collateralAsset, _amount, _index);
  }

  function removeCollateral(
    address _collateralAsset,
    uint256 _amount,
    uint256 _index
  ) external {
    return vault.removeCollateral(_collateralAsset, _amount, _index);
  }

  function totalCollateral() external returns (uint256) {
    uint256 total = 0;
    for (uint256 i = 0; i < vault.collateralAmounts.length; i++) {
      total = total.add(vault.collateralAmounts[i]);
    }
    return total;
  }

  /*** collateral entity  */
  function collateralAmountLength() external returns (uint256) {
    return vault.collateralAmounts.length;
  }

  function collateralAssetsLength() external returns (uint256) {
    return vault.collateralAssets.length;
  }

  function getCollateralAmount(uint256 index) external returns (uint256) {
    return vault.collateralAmounts[index];
  }

  function getCollateralAsset(uint256 index) external returns (address) {
    return vault.collateralAssets[index];
  }

  /*** short entity  */
  function totalShortAmount() external returns (uint256) {
    uint256 total = 0;
    for (uint256 i = 0; i < vault.shortAmounts.length; i++) {
      total = total.add(vault.shortAmounts[i]);
    }
    return total;
  }

  function shortAmountLength() external returns (uint256) {
    return vault.shortAmounts.length;
  }

  function shortOtokensLength() external returns (uint256) {
    return vault.shortOtokens.length;
  }

  function getShortOtoken(uint256 index) external returns (address) {
    return vault.shortOtokens[index];
  }

  function getShortAmount(uint256 index) external returns (uint256) {
    return vault.shortAmounts[index];
  }

  /*** long entity  */

  function totalLongAmount() external returns (uint256) {
    uint256 total = 0;
    for (uint256 i = 0; i < vault.longAmounts.length; i++) {
      total = total.add(vault.longAmounts[i]);
    }
    return total;
  }

  function longAmountLength() external returns (uint256) {
    return vault.longAmounts.length;
  }

  function longOtokensLength() external returns (uint256) {
    return vault.longOtokens.length;
  }

  function getLongOtoken(uint256 index) external returns (address) {
    return vault.longOtokens[index];
  }

  function getLongAmount(uint256 index) external returns (uint256) {
    return vault.longAmounts[index];
  }

  // simulate constructor for verifying invariants at initial state
  function init_state() external {}
}
