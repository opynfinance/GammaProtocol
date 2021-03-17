/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;
pragma experimental ABIEncoderV2;

import {MarginCalculator} from "../MarginCalculator.sol";
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

    function getNakedMarginRequired(
        address _underlying,
        address _strike,
        address _collateral,
        uint256 _shortAmount,
        uint256 _strikePrice,
        uint256 _underlyingPrice,
        uint256 _shortExpiryTimestamp,
        bool _isPut,
        uint256 _marginDecimal
    ) external view returns (uint256) {
        bytes32 productHash = keccak256(abi.encode(_underlying, _strike, _collateral, _isPut));

        FixedPointInt256.FixedPointInt memory shortAmount = FixedPointInt256.fromScaledUint(_shortAmount, BASE);
        FixedPointInt256.FixedPointInt memory shortStrike = FixedPointInt256.fromScaledUint(_strikePrice, BASE);
        FixedPointInt256.FixedPointInt memory shortUnderlyingPrice = FixedPointInt256.fromScaledUint(
            _underlyingPrice,
            BASE
        );

        return
            FixedPointInt256.toScaledUint(
                _getNakedMarginRequired(
                    productHash,
                    shortAmount,
                    shortStrike,
                    shortUnderlyingPrice,
                    _shortExpiryTimestamp,
                    _isPut
                ),
                _marginDecimal,
                false
            );
    }
}
