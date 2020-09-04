/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import {OtokenInterface} from "../interfaces/OtokenInterface.sol";
import {MarginAccount} from "../libs/MarginAccount.sol";
import {FixedPointInt256} from "../libs/FixedPointInt256.sol";
import {SignedConverter} from "../libs/SignedConverter.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

contract MockMarginCalculator {
    using SafeMath for uint256;
    using FixedPointInt256 for FixedPointInt256.FixedPointInt;

    mapping(address => uint256) public price;
    mapping(address => bool) public isPriceFinalized;

    function getExpiredCashValue(address _otoken) public view returns (uint256) {
        require(_otoken != address(0), "MarginCalculator: Invalid token address.");
        OtokenInterface otoken = OtokenInterface(_otoken);
        require(now > otoken.expiryTimestamp(), "MarginCalculator: Otoken not expired yet.");

        uint256 strikePrice = otoken.strikePrice();
        (uint256 underlyingPrice, bool isFinalized) = _getUnderlyingPrice(_otoken);
        require(isFinalized, "MarginCalculator: Oracle price not finalized yet.");

        if (otoken.isPut()) {
            return strikePrice > underlyingPrice ? strikePrice.sub(underlyingPrice) : 0;
        } else {
            return underlyingPrice > strikePrice ? underlyingPrice.sub(strikePrice) : 0;
        }
    }

    function getExcessCollateral(MarginAccount.Vault memory _vault) public view returns (uint256, bool) {
        // ensure the number of collateral, long and short array is valid.
        _checkIsValidSpread(_vault);
        // ensure that the collateral asset is valid for the short asset
        require(_isMarginableCollateral(_vault), "MarginCalculator: collateral asset nor marginable for short asset");
        // ensure the long asset is valid for the short asset.
        require(_isMarginableLong(_vault), "MarginCalculator: long asset not marginable for short asset");

        // collateral amount is always positive.
        FixedPointInt256.FixedPointInt memory collateralAmount = _vault.collateralAmounts.length > 0
            ? _uint256ToFixedPointInt(_vault.collateralAmounts[0])
            : _uint256ToFixedPointInt(0);

        // Vault contains no short tokens: return collateral value.
        if ((_vault.shortOtokens.length == 0) || (_vault.shortOtokens[0] == address(0)))
            return (SignedConverter.intToUint(collateralAmount.value), true);

        FixedPointInt256.FixedPointInt memory marginRequirement = _getMarginRequired(_vault);
        // if marginRequirement > 0, the long assets cannot cover the max loss of short assets in the vault.
        // will need to check if collateral - marginRequirement is greater than 0.
        FixedPointInt256.FixedPointInt memory excessMargin = collateralAmount.sub(marginRequirement);
        bool isExcess = excessMargin.isGreaterThanOrEqual(_uint256ToFixedPointInt(0));
        uint256 netValue = SignedConverter.intToUint(excessMargin.value);
        return (netValue, isExcess);
    }

    function _getMarginRequired(MarginAccount.Vault memory _vault)
        internal
        view
        returns (FixedPointInt256.FixedPointInt memory marginRequired)
    {
        // The vault passed in has a short array == 1, so we can just use shortAmounts[0]
        FixedPointInt256.FixedPointInt memory shortAmount = _uint256ToFixedPointInt(_vault.shortAmounts[0]);

        bool hasLongInVault = _vault.longOtokens.length > 0 && _vault.longOtokens[0] != address(0);
        FixedPointInt256.FixedPointInt memory longAmount = hasLongInVault
            ? _uint256ToFixedPointInt(_vault.longAmounts[0])
            : _uint256ToFixedPointInt(0);

        OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);
        bool expired = now > short.expiryTimestamp();
        bool isPut = short.isPut();

        if (!expired) {
            FixedPointInt256.FixedPointInt memory shortStrike = _uint256ToFixedPointInt(short.strikePrice());
            FixedPointInt256.FixedPointInt memory longStrike = hasLongInVault
                ? _uint256ToFixedPointInt(OtokenInterface(_vault.longOtokens[0]).strikePrice())
                : _uint256ToFixedPointInt(0);

            if (isPut) {
                marginRequired = _getPutSpreadMarginRequired(shortAmount, longAmount, shortStrike, longStrike);
            } else {
                marginRequired = _getCallSpreadMarginRequired(shortAmount, longAmount, shortStrike, longStrike);
            }
        } else {
            FixedPointInt256.FixedPointInt memory shortCashValue = _uint256ToFixedPointInt(
                getExpiredCashValue(address(short))
            );
            FixedPointInt256.FixedPointInt memory longCashValue = hasLongInVault
                ? _uint256ToFixedPointInt(getExpiredCashValue(_vault.longOtokens[0]))
                : _uint256ToFixedPointInt(0);

            if (isPut) {
                marginRequired = _getExpiredPutSpreadCashValue(shortAmount, longAmount, shortCashValue, longCashValue);
            } else {
                (uint256 underlyingPrice, ) = _getUnderlyingPrice(address(short));
                FixedPointInt256.FixedPointInt memory underlyingPriceInt = _uint256ToFixedPointInt(underlyingPrice);
                marginRequired = _getExpiredCallSpreadCashValue(
                    shortAmount,
                    longAmount,
                    shortCashValue,
                    longCashValue,
                    underlyingPriceInt
                );
            }
        }
    }

    function _getPutSpreadMarginRequired(
        FixedPointInt256.FixedPointInt memory _shortAmount,
        FixedPointInt256.FixedPointInt memory _longAmount,
        FixedPointInt256.FixedPointInt memory _shortStrike,
        FixedPointInt256.FixedPointInt memory _longStrike
    ) internal pure returns (FixedPointInt256.FixedPointInt memory) {
        return
            FixedPointInt256.max(
                _shortAmount.mul(_shortStrike).sub(_longStrike.mul(FixedPointInt256.min(_shortAmount, _longAmount))),
                FixedPointInt256.FixedPointInt(0)
            );
    }

    function _getCallSpreadMarginRequired(
        FixedPointInt256.FixedPointInt memory _shortAmount,
        FixedPointInt256.FixedPointInt memory _longAmount,
        FixedPointInt256.FixedPointInt memory _shortStrike,
        FixedPointInt256.FixedPointInt memory _longStrike
    ) internal pure returns (FixedPointInt256.FixedPointInt memory) {
        FixedPointInt256.FixedPointInt memory zero = FixedPointInt256.FixedPointInt(0);
        // if long strike == 0, return short amount
        if (_longStrike.isEqual(zero)) {
            return _shortAmount;
        }
        FixedPointInt256.FixedPointInt memory firstPart = _longStrike.sub(_shortStrike).mul(_shortAmount).div(
            _longStrike
        );
        FixedPointInt256.FixedPointInt memory secondPart = FixedPointInt256.max(_shortAmount.sub(_longAmount), zero);

        return FixedPointInt256.max(firstPart, secondPart);
    }

    function _getExpiredPutSpreadCashValue(
        FixedPointInt256.FixedPointInt memory _shortAmount,
        FixedPointInt256.FixedPointInt memory _longAmount,
        FixedPointInt256.FixedPointInt memory _shortCashValue,
        FixedPointInt256.FixedPointInt memory _longCashValue
    ) internal pure returns (FixedPointInt256.FixedPointInt memory) {
        return _shortCashValue.mul(_shortAmount).sub(_longCashValue.mul(_longAmount));
    }

    function _getExpiredCallSpreadCashValue(
        FixedPointInt256.FixedPointInt memory _shortAmount,
        FixedPointInt256.FixedPointInt memory _longAmount,
        FixedPointInt256.FixedPointInt memory _shortCashValue,
        FixedPointInt256.FixedPointInt memory _longCashValue,
        FixedPointInt256.FixedPointInt memory _underlyingPriceInt
    ) internal pure returns (FixedPointInt256.FixedPointInt memory) {
        return _shortCashValue.mul(_shortAmount).sub((_longCashValue.mul(_longAmount))).div(_underlyingPriceInt);
    }

    function _checkIsValidSpread(MarginAccount.Vault memory _vault) internal pure {
        require(_vault.shortOtokens.length <= 1, "MarginCalculator: Too many short otokens in the vault.");
        require(_vault.longOtokens.length <= 1, "MarginCalculator: Too many long otokens in the vault.");
        require(_vault.collateralAssets.length <= 1, "MarginCalculator: Too many collateral assets in the vault.");

        require(
            _vault.shortOtokens.length == _vault.shortAmounts.length,
            "MarginCalculator: Short asset and amount mismatch."
        );
        require(
            _vault.longOtokens.length == _vault.longAmounts.length,
            "MarginCalculator: Long asset and amount mismatch."
        );
        require(
            _vault.collateralAssets.length == _vault.collateralAmounts.length,
            "MarginCalculator: Collateral asset and amount mismatch."
        );
    }

    function _isMarginableLong(MarginAccount.Vault memory _vault) internal view returns (bool) {
        if (_isEmptyAssetArray(_vault.longOtokens) || _isEmptyAssetArray(_vault.shortOtokens)) return true;

        OtokenInterface long = OtokenInterface(_vault.longOtokens[0]);
        OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);
        bool isMarginable = long.underlyingAsset() == short.underlyingAsset() &&
            long.strikeAsset() == short.strikeAsset() &&
            long.collateralAsset() == short.collateralAsset() &&
            long.expiryTimestamp() == short.expiryTimestamp();

        return isMarginable;
    }

    function _isMarginableCollateral(MarginAccount.Vault memory _vault) internal view returns (bool) {
        if (_isEmptyAssetArray(_vault.collateralAssets) || _isEmptyAssetArray(_vault.shortOtokens)) return true;

        OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);

        bool isMarginable = short.collateralAsset() == _vault.collateralAssets[0];

        return isMarginable;
    }

    function _getUnderlyingPrice(address _otoken) internal view returns (uint256, bool) {
        return (price[_otoken], isPriceFinalized[_otoken]);
    }

    function _uint256ToFixedPointInt(uint256 _num) internal pure returns (FixedPointInt256.FixedPointInt memory) {
        return FixedPointInt256.FixedPointInt(SignedConverter.uintToInt(_num));
    }

    function _isEmptyAssetArray(address[] memory _assets) internal pure returns (bool) {
        return _assets.length == 0 || _assets[0] == address(0);
    }
}
