/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;
pragma experimental ABIEncoderV2;

import {SafeMath} from "./packages/oz/SafeMath.sol";
import {OtokenInterface} from "./interfaces/OtokenInterface.sol";
import {OracleInterface} from "./interfaces/OracleInterface.sol";
import {ERC20Interface} from "./interfaces/ERC20Interface.sol";
import {AddressBookInterface} from "./interfaces/AddressBookInterface.sol";
import {FixedPointInt256 as FPI} from "./libs/FixedPointInt256.sol";
import {SignedConverter} from "./libs/SignedConverter.sol";
import {MarginAccount} from "./libs/MarginAccount.sol";

/**
 * @title MarginCalculator
 * @author Opyn
 * @notice Calculator module that check if a given vault is valid.
 */
contract MarginCalculator {
    using SafeMath for uint256;
    using FPI for FPI.FixedPointInt;
    using FPI for int256;

    address public addressBook;

    constructor(address _addressBook) public {
        require(_addressBook != address(0), "MarginCalculator: invalid addressbook");

        addressBook = _addressBook;
    }

    /**
     * @notice Return the net worth of an expired oToken in collateral.
     * @param _otoken otoken address
     * @return the exchange rate that shows how much collateral unit can be take out by 1 otoken unit, scaled by 1e18
     */
    function getExpiredPayoutRate(address _otoken) external view returns (uint256) {
        uint256 cashValueInStrike = _getExpiredCashValue(_otoken);

        OtokenInterface otoken = OtokenInterface(_otoken);
        address strike = otoken.strikeAsset();
        address collateral = otoken.collateralAsset();

        uint256 exchangeRate;

        if (strike == collateral) {
            exchangeRate = cashValueInStrike;
        } else {
            uint256 expiry = otoken.expiryTimestamp();
            // isFinalized of strike asset is already checked in _getExpiredCashValue
            (uint256 strikePrice, ) = _getAssetPrice(strike, expiry);
            (uint256 collateralPrice, bool isCollateralPriceFinalized) = _getAssetPrice(collateral, expiry);
            require(isCollateralPriceFinalized, "MarginCalculator: collateral price is not finalized");
            exchangeRate = cashValueInStrike.mul(strikePrice).div(collateralPrice);
        }

        // the exchangeRate was scaled by 1e18, if 1e18 otoken can take out 1 USDC, the exchangeRate is currently 1e18
        // we want to return: how much USDC unit can be take out by 1 (1e18 units) otoken
        return _internalAmountToTokenAmount(exchangeRate, collateral);
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

        bool hasCollateral = !_isEmptyAssetArray(_vault.collateralAssets);

        // collateral amount is always positive.
        FPI.FixedPointInt memory collateralAmount = hasCollateral
            ? _uint256ToFPI(_tokenAmountToInternalAmount(_vault.collateralAmounts[0], _vault.collateralAssets[0]))
            : _uint256ToFPI(0);

        // Vault contains no short tokens: return collateral value.
        if (_isEmptyAssetArray(_vault.shortOtokens)) {
            uint256 amount = hasCollateral ? _vault.collateralAmounts[0] : 0;
            return (amount, true);
        }

        // get required margin, denominated in strike or underlying asset
        FPI.FixedPointInt memory marginRequirement = _getMarginRequired(_vault);
        // get exchange rate to convert marginRequirement to amount of collateral
        FPI.FixedPointInt memory exchangeRate = _getToCollateralRate(_vault.shortOtokens[0]);

        // only multiplied by the exchange rate if it's not equal to 1, to avoid rounding problem.
        FPI.FixedPointInt memory collateralRequired = exchangeRate.isEqual(FPI.fromUnscaledInt(1))
            ? marginRequirement
            : marginRequirement.mul(exchangeRate);

        FPI.FixedPointInt memory excessCollateral = collateralAmount.sub(collateralRequired);
        bool isExcess = excessCollateral.isGreaterThanOrEqual(_uint256ToFPI(0));

        uint256 excessCollateralInternal = SignedConverter.intToUint(excessCollateral.value);

        // convert from internal amount to token's native amount
        uint256 excessCollateralExternal = hasCollateral
            ? _internalAmountToTokenAmount(excessCollateralInternal, _vault.collateralAssets[0])
            : excessCollateralInternal;

        return (excessCollateralExternal, isExcess);
    }

    /**
     * @notice Return the cash value of an expired oToken.
     * @dev For call return = Max (0, ETH Price - oToken.strike)
     * @dev For put return Max(0, oToken.strike - ETH Price)
     * @param _otoken otoken address
     * @return the cash value of an expired otoken, denominated in strike asset. scaled by 1e18
     */
    function _getExpiredCashValue(address _otoken) internal view returns (uint256) {
        require(_otoken != address(0), "MarginCalculator: Invalid token address.");
        OtokenInterface otoken = OtokenInterface(_otoken);
        require(now > otoken.expiryTimestamp(), "MarginCalculator: Otoken not expired yet.");

        // strike price is denominated in strike asset.
        uint256 strikePrice = otoken.strikePrice();

        // divide price of underlying by price of strike,
        // to get the real price of underlying denominated in strike at expiry
        (uint256 underlyingPrice, bool isUnderlyingFinalized) = _getAssetPrice(
            otoken.underlyingAsset(),
            otoken.expiryTimestamp()
        );
        (uint256 strikeAssetPrice, bool isStrikeFinalized) = _getAssetPrice(
            otoken.strikeAsset(),
            otoken.expiryTimestamp()
        );

        require(isUnderlyingFinalized, "MarginCalculator: underlying price not finalized yet.");
        require(isStrikeFinalized, "MarginCalculator: strike price not finalized yet.");

        FPI.FixedPointInt memory underlyingPriceFixedPoint = _uint256ToFPI(underlyingPrice);
        FPI.FixedPointInt memory strikeAssetPriceFixedPoint = _uint256ToFPI(strikeAssetPrice);

        FPI.FixedPointInt memory underlyingToStrikeFixedPoint = underlyingPriceFixedPoint.div(
            strikeAssetPriceFixedPoint
        );

        uint256 underlyingToStrike = SignedConverter.intToUint(underlyingToStrikeFixedPoint.value);

        if (otoken.isPut()) {
            return strikePrice > underlyingToStrike ? strikePrice.sub(underlyingToStrike) : 0;
        } else {
            return underlyingToStrike > strikePrice ? underlyingToStrike.sub(strikePrice) : 0;
        }
    }

    /**
     * @notice Calculate the amount of collateral needed for a spread vault.
     * @dev The vault passed in already pass amount array length = asset array length check.
     * @param _vault the theoretical vault that needs to be checked
     * @return marginRequired the minimal amount of collateral needed in a vault.
     */
    function _getMarginRequired(MarginAccount.Vault memory _vault) internal view returns (FPI.FixedPointInt memory) {
        // The vault passed in has a short array == 1, so we can just use shortAmounts[0]
        // Don't have to scale the short token, because all otoken has decimals 18
        FPI.FixedPointInt memory shortAmount = _uint256ToFPI(_vault.shortAmounts[0]);

        bool hasLongInVault = !_isEmptyAssetArray(_vault.longOtokens);
        FPI.FixedPointInt memory longAmount = hasLongInVault
            ? _uint256ToFPI(_tokenAmountToInternalAmount(_vault.longAmounts[0], _vault.longOtokens[0]))
            : _uint256ToFPI(0);

        OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);
        bool expired = now > short.expiryTimestamp();
        bool isPut = short.isPut();

        // marginRequired is denominated in underlying for call, and denominated in strike in put.
        FPI.FixedPointInt memory marginRequired = _uint256ToFPI(0);

        if (!expired) {
            FPI.FixedPointInt memory shortStrike = _uint256ToFPI(short.strikePrice());
            FPI.FixedPointInt memory longStrike = hasLongInVault
                ? _uint256ToFPI(OtokenInterface(_vault.longOtokens[0]).strikePrice())
                : _uint256ToFPI(0);

            if (isPut) {
                marginRequired = _getPutSpreadMarginRequired(shortAmount, longAmount, shortStrike, longStrike);
            } else {
                marginRequired = _getCallSpreadMarginRequired(shortAmount, longAmount, shortStrike, longStrike);
            }
        } else {
            FPI.FixedPointInt memory shortCashValue = _uint256ToFPI(_getExpiredCashValue(address(short)));
            FPI.FixedPointInt memory longCashValue = hasLongInVault
                ? _uint256ToFPI(_getExpiredCashValue(_vault.longOtokens[0]))
                : _uint256ToFPI(0);

            if (isPut) {
                marginRequired = _getExpiredPutSpreadCashValue(shortAmount, longAmount, shortCashValue, longCashValue);
            } else {
                (uint256 underlyingPrice, ) = _getAssetPrice(short.underlyingAsset(), short.expiryTimestamp());
                FPI.FixedPointInt memory underlyingPriceInt = _uint256ToFPI(underlyingPrice);
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
        FPI.FixedPointInt memory _shortAmount,
        FPI.FixedPointInt memory _longAmount,
        FPI.FixedPointInt memory _shortStrike,
        FPI.FixedPointInt memory _longStrike
    ) internal pure returns (FPI.FixedPointInt memory) {
        return
            FPI.max(
                _shortAmount.mul(_shortStrike).sub(_longStrike.mul(FPI.min(_shortAmount, _longAmount))),
                _uint256ToFPI(0)
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
        FPI.FixedPointInt memory _shortAmount,
        FPI.FixedPointInt memory _longAmount,
        FPI.FixedPointInt memory _shortStrike,
        FPI.FixedPointInt memory _longStrike
    ) internal pure returns (FPI.FixedPointInt memory) {
        FPI.FixedPointInt memory zero = _uint256ToFPI(0);
        // if long strike == 0, return short amount
        if (_longStrike.isEqual(zero)) {
            return _shortAmount;
        }

        /**
         *             (long strike - short strike) * short amount
         * calculate  ----------------------------------------------
         *                             long strike
         */
        FPI.FixedPointInt memory firstPart = _longStrike.sub(_shortStrike).mul(_shortAmount).div(_longStrike);

        /**
         * calculate max ( short amount - long amount , 0)
         */
        FPI.FixedPointInt memory secondPart = FPI.max(_shortAmount.sub(_longAmount), zero);

        return FPI.max(firstPart, secondPart);
    }

    /**
     * @dev calculate cash value for an expired put spread vault.
     *
     * Formula: net = (short cash value * short amount) - ( long cash value * long Amount )
     *
     * @return cash value denominated in strike asset.
     */
    function _getExpiredPutSpreadCashValue(
        FPI.FixedPointInt memory _shortAmount,
        FPI.FixedPointInt memory _longAmount,
        FPI.FixedPointInt memory _shortCashValue,
        FPI.FixedPointInt memory _longCashValue
    ) internal pure returns (FPI.FixedPointInt memory) {
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
        FPI.FixedPointInt memory _shortAmount,
        FPI.FixedPointInt memory _longAmount,
        FPI.FixedPointInt memory _shortCashValue,
        FPI.FixedPointInt memory _longCashValue,
        FPI.FixedPointInt memory _underlyingPriceInt
    ) internal pure returns (FPI.FixedPointInt memory) {
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
     * @dev internal function to get price of an asset
     * @param _asset asset address
     * @return price the underlying asset price with 18 decimals
     * @return isFinalized the price is finalized by the oracle and can't be changed
     */
    function _getAssetPrice(address _asset, uint256 _expiry) internal view returns (uint256 price, bool isFinalized) {
        OracleInterface oracle = OracleInterface(AddressBookInterface(addressBook).getOracle());
        return oracle.getExpiryPrice(_asset, _expiry);
    }

    /**
     * @notice internal function to calculate strike / underlying to collateral exchange rate.
     * @dev for call, returns collateral / underlying rate
     * @dev for put, returns collateral / strike rate
     * @return the exchange rate to convert amount in strike or underlying to equivilent value of collateral.
     */
    function _getToCollateralRate(address _short) internal view returns (FPI.FixedPointInt memory) {
        OtokenInterface short = OtokenInterface(_short);
        OracleInterface oracle = OracleInterface(AddressBookInterface(addressBook).getOracle());

        FPI.FixedPointInt memory toCollateralExchangeRate = FPI.fromUnscaledInt(1);
        address collateral = short.collateralAsset();
        if (short.isPut()) {
            address strike = short.strikeAsset();
            if (strike != collateral) {
                // price is already scaled by 1e18
                uint256 strikePrice = oracle.getPrice(strike);
                uint256 collateralPrice = oracle.getPrice(collateral);
                toCollateralExchangeRate = _uint256ToFPI(strikePrice).div(_uint256ToFPI(collateralPrice));
            }
        } else {
            address underlying = short.underlyingAsset();
            if (underlying != collateral) {
                uint256 underlyingPrice = oracle.getPrice(underlying);
                uint256 collateralPrice = oracle.getPrice(collateral);
                toCollateralExchangeRate = _uint256ToFPI(underlyingPrice).div(_uint256ToFPI(collateralPrice));
            }
        }

        return toCollateralExchangeRate;
    }

    /**
     * @dev convert uint256 to FixedPointInt, no scaling invloved
     * @return the FixedPointInt format of input
     */
    function _uint256ToFPI(uint256 _num) internal pure returns (FPI.FixedPointInt memory) {
        return FPI.FixedPointInt(SignedConverter.uintToInt(_num));
    }

    /**
     * @dev check if array is empty or only have address(0)
     * @return isEmpty or not
     */
    function _isEmptyAssetArray(address[] memory _assets) internal pure returns (bool) {
        return _assets.length == 0 || _assets[0] == address(0);
    }

    /**
     * @dev convert a uint256 amount
     * Examples:
     * (1)  USDC    decimals = 6
     *      Input:  8000000 USDC =>     Output: 8 * 1e18 (8.0 USDC)
     * (2)  cUSDC   decimals = 8
     *      Input:  8000000 cUSDC =>    Output: 8 * 1e16 (0.08 cUSDC)
     * (3)  rUSD    decimals = 20 (random USD)
     *      Input:  15                    =>   Output:  0       rUSDC
     * @return internal amount that is sacled by 1e18.
     */
    function _tokenAmountToInternalAmount(uint256 _amount, address _token) internal view returns (uint256) {
        ERC20Interface token = ERC20Interface(_token);
        uint256 decimals = uint256(token.decimals());
        uint256 base = 18;
        if (decimals == base) return _amount;
        if (decimals > base) {
            uint256 exp = decimals - base;
            return _amount.div(10**exp);
        } else {
            uint256 exp = base - decimals;
            return _amount.mul(10**exp);
        }
    }

    /**
     * @dev convert an internal amount (1e18) to native token amount
     * Examples:
     * (1)  USDC    decimals = 6
     *      Input:  8 * 1e18 (8.0 USDC)   =>   Output:  8000000 USDC
     * (2)  cUSDC   decimals = 8
     *      Input:  8 * 1e16 (0.08 cUSDC) =>   Output:  8000000 cUSDC
     * (3)  rUSD    decimals = 20 (random USD)
     *      Input:  1                    =>    Output:  100     rUSDC
     * @return token amount in its native form.
     */
    function _internalAmountToTokenAmount(uint256 _amount, address _token) internal view returns (uint256) {
        ERC20Interface token = ERC20Interface(_token);
        uint256 decimals = uint256(token.decimals());
        uint256 base = 18;
        if (decimals == base) return _amount;
        if (decimals > base) {
            uint256 exp = decimals - base;
            return _amount.mul(10**exp);
        } else {
            uint256 exp = base - decimals;
            return _amount.div(10**exp);
        }
    }
}
