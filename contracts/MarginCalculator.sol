/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;
pragma experimental ABIEncoderV2;

import {SafeMath} from "./packages/oz/SafeMath.sol";
import {OtokenInterface} from "./interfaces/OtokenInterface.sol";
import {OracleInterface} from "./interfaces/OracleInterface.sol";
import {AddressBookInterface} from "./interfaces/AddressBookInterface.sol";
import {FixedPointInt256} from "./libs/FixedPointInt256.sol";
import {SignedConverter} from "./libs/SignedConverter.sol";
import {MarginAccount} from "./libs/MarginAccount.sol";

/**
 * @title MarginCalculator
 * @author Opyn
 * @notice Calculator module that check if a given vault is valid.
 */
contract MarginCalculator {
    using SafeMath for uint256;
    using FixedPointInt256 for FixedPointInt256.FixedPointInt;
    using FixedPointInt256 for int256;

    address public addressBook;

    constructor(address _addressBook) public {
        require(_addressBook != address(0), "MarginCalculator: invalid addressbook");

        addressBook = _addressBook;
    }

    /**
     * @notice Return the cash value of an expired oToken.
     * @dev For call return = Max (0, ETH Price - oToken.strike)
     * @dev For put return Max(0, oToken.strike - ETH Price)
     * @param _otoken otoken address
     * @return the cash value of an expired otoken
     */
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

    /**
     * @notice returns the net value of a vault in the valid collateral asset for that vault i.e. USDC for puts/ ETH for calls
     * @param _vault the theoretical vault that needs to be checked
     * @return excessCollateral the amount by which the margin is above or below the required amount.
     * @return isExcess true if there's excess margin in the vault. In this case, collateral can be taken out from the vault. False if there is insufficient margin and additional collateral needs to be added to the vault to create the position.
     */
    function getExcessCollateral(MarginAccount.Vault memory _vault) public view returns (uint256, bool) {
        // ensure the number of collateral, long and short array is valid.
        _checkIsValidSpread(_vault);
        // ensure that the collateral asset is valid for the short asset
        require(_isMarginableCollateral(_vault), "MarginCalculator: collateral asset not marginable for short asset");
        // ensure the long asset is valid for the short asset.
        require(_isMarginableLong(_vault), "MarginCalculator: long asset not marginable for short asset");

        // collateral amount is always positive.
        FixedPointInt256.FixedPointInt memory collateralAmount = _isEmptyAssetArray(_vault.collateralAssets)
            ? _uint256ToFixedPointInt(0)
            : _uint256ToFixedPointInt(_vault.collateralAmounts[0]);

        // Vault contains no short tokens: return collateral value.
        if (_isEmptyAssetArray(_vault.shortOtokens)) return (SignedConverter.intToUint(collateralAmount.value), true);

        // get required margin, denominated in strike or underlying asset
        FixedPointInt256.FixedPointInt memory marginRequirement = _getMarginRequired(_vault);
        // get exchange rate to convert marginRequirement to amount of collateral
        FixedPointInt256.FixedPointInt memory exchangeRate = _getToCollateralRate(_vault.shortOtokens[0]);

        // only multiplied by the exchange rate if it's not equal to 1, to avoid rounding problem.
        FixedPointInt256.FixedPointInt memory collateralRequired = exchangeRate.isEqual(
            FixedPointInt256.fromUnscaledInt(1)
        )
            ? marginRequirement
            : marginRequirement.mul(exchangeRate);

        FixedPointInt256.FixedPointInt memory excessCollateral = collateralAmount.sub(collateralRequired);
        bool isExcess = excessCollateral.isGreaterThanOrEqual(_uint256ToFixedPointInt(0));

        return (SignedConverter.intToUint(excessCollateral.value), isExcess);
    }

    /**
     * @notice Calculate the amount of collateral needed for a spread vault.
     * @dev The vault passed in already pass amount array length = asset array length check.
     * @param _vault the theoretical vault that needs to be checked
     * @return marginRequired the minimal amount of collateral needed in a vault.
     */
    function _getMarginRequired(MarginAccount.Vault memory _vault)
        internal
        view
        returns (FixedPointInt256.FixedPointInt memory)
    {
        // The vault passed in has a short array == 1, so we can just use shortAmounts[0]
        FixedPointInt256.FixedPointInt memory shortAmount = _uint256ToFixedPointInt(_vault.shortAmounts[0]);

        bool hasLongInVault = !_isEmptyAssetArray(_vault.longOtokens);
        FixedPointInt256.FixedPointInt memory longAmount = hasLongInVault
            ? _uint256ToFixedPointInt(_vault.longAmounts[0])
            : _uint256ToFixedPointInt(0);

        OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);
        bool expired = now > short.expiryTimestamp();
        bool isPut = short.isPut();

        // marginRequired is denominated in underlying for call, and denominated in strike in put.
        FixedPointInt256.FixedPointInt memory marginRequired = _uint256ToFixedPointInt(0);

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

        return marginRequired;
    }

    /**
     * @dev calculate put spread margin requirement.
     * @dev this value is used
     * marginRequired = max( (short amount * short strike) - (long strike * min (short amount, long amount)) , 0 )
     *
     * @return margin requirement denominated in strike asset.
     */
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

    /**
     * @dev calculate call spread marigin requirement.
     *                           (long strike - short strike) * short amount
     * marginRequired =  max( ------------------------------------------------- , max ( short amount - long amount , 0) )
     *                                           long strike
     *
     * @dev if long strike = 0 (no long token), then return net = short amount.
     * @return margin requirement denominated in underlying asset.
     */
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

        /**
         *             (long strike - short strike) * short amount
         * calculate  ----------------------------------------------
         *                             long strike
         */
        FixedPointInt256.FixedPointInt memory firstPart = _longStrike.sub(_shortStrike).mul(_shortAmount).div(
            _longStrike
        );

        /**
         * calculate max ( short amount - long amount , 0)
         */
        FixedPointInt256.FixedPointInt memory secondPart = FixedPointInt256.max(_shortAmount.sub(_longAmount), zero);

        return FixedPointInt256.max(firstPart, secondPart);
    }

    /**
     * @dev calculate cash value for an expired put spread vault.
     *
     * Formula: net = (short cash value * short amount) - ( long cash value * long Amount )
     *
     * @return cash value denominated in strike asset.
     */
    function _getExpiredPutSpreadCashValue(
        FixedPointInt256.FixedPointInt memory _shortAmount,
        FixedPointInt256.FixedPointInt memory _longAmount,
        FixedPointInt256.FixedPointInt memory _shortCashValue,
        FixedPointInt256.FixedPointInt memory _longCashValue
    ) internal pure returns (FixedPointInt256.FixedPointInt memory) {
        return _shortCashValue.mul(_shortAmount).sub(_longCashValue.mul(_longAmount));
    }

    /**
     * @dev calculate cash value for an expired call spread vault.
     *                     (short cash value * short amount) - ( long cash value * long Amount )
     *  Formula: net =   -------------------------------------------------------------------------
     *                                               Underlying price
     * @return cash value denominated in underlying asset.
     */
    function _getExpiredCallSpreadCashValue(
        FixedPointInt256.FixedPointInt memory _shortAmount,
        FixedPointInt256.FixedPointInt memory _longAmount,
        FixedPointInt256.FixedPointInt memory _shortCashValue,
        FixedPointInt256.FixedPointInt memory _longCashValue,
        FixedPointInt256.FixedPointInt memory _underlyingPriceInt
    ) internal pure returns (FixedPointInt256.FixedPointInt memory) {
        return _shortCashValue.mul(_shortAmount).sub((_longCashValue.mul(_longAmount))).div(_underlyingPriceInt);
    }

    /**
     * @dev ensure that the vault contains
     * a) at most 1 asset type used as collateral,
     * b) at most 1 series of option used as the long option and
     * c) at most 1 series of option used as the short option.
     * @param _vault the vault to check.
     */
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

    /**
     * @dev if there is a short option in the vault, ensure that the long option series being used is a valid margin.
     * @param _vault the vault to check.
     */
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

    /**
     * @dev if there is a short option in the vault, ensure that the collateral asset being used is a valid margin.
     * @param _vault the vault to check.
     */
    function _isMarginableCollateral(MarginAccount.Vault memory _vault) internal view returns (bool) {
        if (_isEmptyAssetArray(_vault.collateralAssets) || _isEmptyAssetArray(_vault.shortOtokens)) return true;

        OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);

        bool isMarginable = short.collateralAsset() == _vault.collateralAssets[0];

        return isMarginable;
    }

    /**
     * @dev internal function to get underlying price of an otoken.
     * @param _otoken otoken address
     * @return price the underlying asset price with 18 decimals
     * @return isFinalized the price is finalized by the oracle and can't be changed
     */
    function _getUnderlyingPrice(address _otoken) internal view returns (uint256 price, bool isFinalized) {
        OracleInterface oracle = OracleInterface(AddressBookInterface(addressBook).getOracle());
        OtokenInterface otoken = OtokenInterface(_otoken);
        // return (otoken.expiryTimestamp(), true);
        return oracle.getExpiryPrice(otoken.underlyingAsset(), otoken.expiryTimestamp());
    }

    /**
     * @notice internal function to calculate strike / underlying to collateral exchange rate.
     * @dev for call, returns collateral / underlying rate
     * @dev for put, returns collateral / strike rate
     * @return the exchange rate to convert amount in strike or underlying to equivilent value of collateral.
     */
    function _getToCollateralRate(address _short) internal view returns (FixedPointInt256.FixedPointInt memory) {
        OtokenInterface short = OtokenInterface(_short);
        OracleInterface oracle = OracleInterface(AddressBookInterface(addressBook).getOracle());

        FixedPointInt256.FixedPointInt memory toCollateralExchangeRate = FixedPointInt256.fromUnscaledInt(1);
        address collateral = short.collateralAsset();
        if (short.isPut()) {
            address strike = short.strikeAsset();
            if (strike != collateral) {
                // price is already scaled by 1e18
                uint256 strikePrice = oracle.getPrice(strike);
                uint256 collateralPrice = oracle.getPrice(collateral);
                toCollateralExchangeRate = _uint256ToFixedPointInt(strikePrice).div(
                    _uint256ToFixedPointInt(collateralPrice)
                );
            }
        } else {
            address underlying = short.underlyingAsset();
            if (underlying != collateral) {
                uint256 underlyingPrice = oracle.getPrice(underlying);
                uint256 collateralPrice = oracle.getPrice(collateral);
                toCollateralExchangeRate = _uint256ToFixedPointInt(underlyingPrice).div(
                    _uint256ToFixedPointInt(collateralPrice)
                );
            }
        }

        return toCollateralExchangeRate;
    }

    /**
     * @dev convert uint256 to FixedPointInt, no scaling invloved
     * @return the FixedPointInt format of input
     */
    function _uint256ToFixedPointInt(uint256 _num) internal pure returns (FixedPointInt256.FixedPointInt memory) {
        return FixedPointInt256.FixedPointInt(SignedConverter.uintToInt(_num));
    }

    /**
     * @dev check if array is empty or only have address(0)
     * @return isEmpty or not
     */
    function _isEmptyAssetArray(address[] memory _assets) internal pure returns (bool) {
        return _assets.length == 0 || _assets[0] == address(0);
    }
}
