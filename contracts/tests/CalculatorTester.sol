/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;
pragma experimental ABIEncoderV2;

import {MarginCalculator} from "../core/MarginCalculator.sol";
import {FixedPointInt256} from "../libs/FixedPointInt256.sol";

contract CalculatorTester is MarginCalculator {
    constructor(address _addressBook) public MarginCalculator(_addressBook) {}

    function getExpiredCashValue(
        address _underlying,
        address _strike,
        uint256 _expiryTimestamp,
        uint256 _strikePrice,
        bool _isPut
    ) external view returns (uint256) {
        return
            FixedPointInt256.toScaledUint(
                _getExpiredCashValue(_underlying, _strike, _expiryTimestamp, _strikePrice, _isPut),
                BASE,
                true
            );
    }

    function findUpperBoundValue(
        address _underlying,
        address _strike,
        address _collateral,
        bool _isPut,
        uint256 _expiryTimestamp
    ) external view returns (uint256) {
        bytes32 productHash = keccak256(abi.encode(_underlying, _strike, _collateral, _isPut));

        return FixedPointInt256.toScaledUint(_findUpperBoundValue(productHash, _expiryTimestamp), 27, false);
    }

    function price(
        uint256 _vaultCollateral,
        uint256 _vaultDebt,
        uint256 _cv,
        uint256 _spotPrice,
        uint256 _auctionStartingTime,
        uint256 _collateralDecimals,
        bool _isPut
    ) external view returns (uint256) {
        FixedPointInt256.FixedPointInt memory vaultCollateral = FixedPointInt256.fromScaledUint(
            _vaultCollateral,
            _collateralDecimals
        );
        FixedPointInt256.FixedPointInt memory vaultDebt = FixedPointInt256.fromScaledUint(_vaultDebt, BASE);
        FixedPointInt256.FixedPointInt memory cv = FixedPointInt256.fromScaledUint(_cv, BASE);
        FixedPointInt256.FixedPointInt memory spotPrice = FixedPointInt256.fromScaledUint(_spotPrice, BASE);

        return
            _getDebtPrice(vaultCollateral, vaultDebt, cv, spotPrice, _auctionStartingTime, _collateralDecimals, _isPut);
    }
}
