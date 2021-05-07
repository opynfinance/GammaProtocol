pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import '../../contracts/core/MarginCalculator.sol';

//import {MarginVault} from "../../contracts/libs/MarginVault.sol";

contract MarginCalculatorHarness {
  // we are assuming one short otoken, one long otoken and one collateral
  //	mapping :	collateral amount => short amount => long amount => collateralAsset
  mapping(uint256 => mapping(uint256 => mapping(uint256 => uint256))) internal excessCollateral;

  function getExcessCollateral(MarginVault.Vault memory _vault) public view returns (uint256, bool) {
    uint256 excess = excessCollateral[_vault.collateralAmounts[0]][_vault.shortAmounts[0]][_vault.longAmounts[0]];
    if (excess >= 0) return (uint256(excess), true);
    else return (uint256(-excess), false);
  }

  function getExcessCollateral(
    uint256 shortAmounts,
    uint256 longAmounts,
    uint256 collateralAmounts
  ) public view returns (uint256, bool) {
    uint256 excess = excessCollateral[collateralAmounts][shortAmounts][longAmounts];
    if (excess >= 0) return (uint256(excess), true);
    else return (uint256(-excess), false);
  }

  mapping(address => uint256) internal expiredPayoutRate;

  function getExpiredPayoutRate(address _otoken) external view returns (uint256) {
    return expiredPayoutRate[_otoken];
  }
}
