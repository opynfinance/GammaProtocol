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
    using SignedConverter for uint256;
    using SignedConverter for int256;
    using FPI for int256;
    using FPI for FPI.FixedPointInt;

    address public addressBook;

    uint256 internal constant BASE = 18;
    FPI.FixedPointInt internal ZERO = _uintToFixedPoint(0, BASE);

    constructor(address _addressBook) public {
        require(_addressBook != address(0), "MarginCalculator: invalid addressbook");

        addressBook = _addressBook;
    }

    /**
     * @notice Return the net worth of an expired oToken, denominated in collateral.
     * @param _otoken otoken address
     * @return the exchange rate that shows how much collateral unit can be take out by 1 otoken unit, scaled by 1e18.
     * Or how much collateral can be taken out for 1 (1e18) otoken
     */
    function getExpiredPayoutRate(address _otoken) external view returns (uint256) {
        FPI.FixedPointInt memory cashValueInStrike = _getExpiredCashValue(_otoken);

        OtokenInterface otoken = OtokenInterface(_otoken);
        address strike = otoken.strikeAsset();
        address collateral = otoken.collateralAsset();

        FPI.FixedPointInt memory exchangeRate;

        if (strike == collateral) {
            exchangeRate = cashValueInStrike;
        } else {
            uint256 expiry = otoken.expiryTimestamp();
            exchangeRate = _convertAmountOnExpiryPrice(cashValueInStrike, strike, collateral, expiry);
        }

        // the exchangeRate was scaled by 1e18, if 1e18 otoken can take out 1 USDC, the exchangeRate is currently 1e18
        // we want to return: how much USDC unit can be take out by 1 (1e18 units) otoken
        uint256 collateralDecimals = uint256(ERC20Interface(collateral).decimals());
        return _fixedPointToUint(exchangeRate, collateralDecimals);
    }

    /**
     * @notice notice returns the amount of collateral that owner can take out from this vault.
     * @dev The return amount is denominated in the collateral asset for the otoken
     * @param _vault the theoretical vault that needs to be checked
     * @return excessCollateral the amount by which the margin is above or below the required amount.
     * @return isExcess True if there's excess margin in the vault. In this case, collateral can be taken out from the vault.
     * False if there is insufficient margin and additional collateral needs to be added to the vault to create the position.
     */
    function getExcessCollateral(MarginAccount.Vault memory _vault) public view returns (uint256, bool) {
        // include all the checks for vault
        _checkIsValidVault(_vault);

        bool hasCollateral = !_isEmptyAssetArray(_vault.collateralAssets);

        // collateral amount is always positive.
        FPI.FixedPointInt memory collateralAmount;
        if (hasCollateral) {
            uint256 colllateralDecimals = ERC20Interface(_vault.collateralAssets[0]).decimals();
            collateralAmount = _uintToFixedPoint(_vault.collateralAmounts[0], colllateralDecimals);
        } else {
            collateralAmount = ZERO;
        }

        // Vault contains no otokens: return collateral value.
        if (_isEmptyAssetArray(_vault.shortOtokens) && _isEmptyAssetArray(_vault.longOtokens)) {
            uint256 amount = hasCollateral ? _vault.collateralAmounts[0] : 0;
            return (amount, true);
        }

        // get required margin, denominated in collateral
        FPI.FixedPointInt memory collateralRequired = _getMarginRequired(_vault);
        FPI.FixedPointInt memory excessCollateral = collateralAmount.sub(collateralRequired);

        bool isExcess = excessCollateral.isGreaterThanOrEqual(ZERO);

        address otoken = _isEmptyAssetArray(_vault.shortOtokens) ? _vault.longOtokens[0] : _vault.shortOtokens[0];
        uint256 collateralDecimals = ERC20Interface(OtokenInterface(otoken).collateralAsset()).decimals();
        uint256 excessCollateralExternal = _fixedPointToUint(excessCollateral, collateralDecimals);

        return (excessCollateralExternal, isExcess);
    }

    /**
     * @notice Return the cash value of an expired oToken, denominated in strike asset.
     * @dev For call return = Max (0, ETH Price - oToken.strike)
     * @dev For put return Max(0, oToken.strike - ETH Price)
     * @param _otoken otoken address
     * @return the cash value of an expired otoken, denominated in strike asset. scaled by 1e18
     */
    function _getExpiredCashValue(address _otoken) internal view returns (FPI.FixedPointInt memory) {
        require(_otoken != address(0), "MarginCalculator: Invalid token address");
        OtokenInterface otoken = OtokenInterface(_otoken);
        require(now > otoken.expiryTimestamp(), "MarginCalculator: Otoken not expired yet");

        // strike price is denominated in strike asset.
        FPI.FixedPointInt memory strikePrice = _uintToFixedPoint(otoken.strikePrice(), BASE);

        // calculate the expiry convertion rate between strike and underlying
        FPI.FixedPointInt memory underlyingPriceInStrike = _convertAmountOnExpiryPrice(
            _uintToFixedPoint(1, 0),
            otoken.underlyingAsset(),
            otoken.strikeAsset(),
            otoken.expiryTimestamp()
        );

        if (otoken.isPut()) {
            return strikePrice.isGreaterThan(underlyingPriceInStrike) ? strikePrice.sub(underlyingPriceInStrike) : ZERO;
        } else {
            return underlyingPriceInStrike.isGreaterThan(strikePrice) ? underlyingPriceInStrike.sub(strikePrice) : ZERO;
        }
    }

    /**
     * @notice Calculate the amount of collateral needed for a spread vault.
     * @dev The vault passed in already pass amount array length = asset array length check.
     * @param _vault the theoretical vault that needs to be checked
     * @return marginRequired the minimal amount of collateral needed in a vault, denominated in collateral
     */
    function _getMarginRequired(MarginAccount.Vault memory _vault) internal view returns (FPI.FixedPointInt memory) {
        // The vault passed must have either long otoken or short otoken in it.
        bool hasLongInVault = !_isEmptyAssetArray(_vault.longOtokens);
        bool hasShortInVault = !_isEmptyAssetArray(_vault.shortOtokens);

        // Don't have to scale the short token, because all otoken has decimals 18
        FPI.FixedPointInt memory shortAmount = hasShortInVault ? _uintToFixedPoint(_vault.shortAmounts[0], BASE) : ZERO;

        FPI.FixedPointInt memory longAmount = hasLongInVault ? _uintToFixedPoint(_vault.longAmounts[0], BASE) : ZERO;

        OtokenInterface otoken = hasShortInVault
            ? OtokenInterface(_vault.shortOtokens[0])
            : OtokenInterface(_vault.longOtokens[0]);
        bool expired = now > otoken.expiryTimestamp();
        bool isPut = otoken.isPut();

        // marginRequired is denominated collateral
        if (!expired) {
            FPI.FixedPointInt memory shortStrike = hasShortInVault
                ? _uintToFixedPoint(OtokenInterface(_vault.shortOtokens[0]).strikePrice(), BASE)
                : ZERO;
            FPI.FixedPointInt memory longStrike = hasLongInVault
                ? _uintToFixedPoint(OtokenInterface(_vault.longOtokens[0]).strikePrice(), BASE)
                : ZERO;

            if (isPut) {
                FPI.FixedPointInt memory strikeNeeded = _getPutSpreadMarginRequired(
                    shortAmount,
                    longAmount,
                    shortStrike,
                    longStrike
                );
                // convert amount to be denominated in collateral
                return _convertAmountOnLivePrice(strikeNeeded, otoken.strikeAsset(), otoken.collateralAsset());
            } else {
                FPI.FixedPointInt memory underlyingNeeded = _getCallSpreadMarginRequired(
                    shortAmount,
                    longAmount,
                    shortStrike,
                    longStrike
                );
                // convert amount to be denominated in collateral
                return _convertAmountOnLivePrice(underlyingNeeded, otoken.underlyingAsset(), otoken.collateralAsset());
            }
        } else {
            FPI.FixedPointInt memory shortCashValue = hasShortInVault
                ? _getExpiredCashValue(_vault.shortOtokens[0])
                : ZERO;
            FPI.FixedPointInt memory longCashValue = hasLongInVault
                ? _getExpiredCashValue(_vault.longOtokens[0])
                : ZERO;

            FPI.FixedPointInt memory valueInStrike = _getExpiredSpreadCashValue(
                shortAmount,
                longAmount,
                shortCashValue,
                longCashValue
            );
            // convert amount to be denominated in collateral
            return
                _convertAmountOnExpiryPrice(
                    valueInStrike,
                    otoken.strikeAsset(),
                    otoken.collateralAsset(),
                    otoken.expiryTimestamp()
                );
        }
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
    ) internal view returns (FPI.FixedPointInt memory) {
        return FPI.max(_shortAmount.mul(_shortStrike).sub(_longStrike.mul(FPI.min(_shortAmount, _longAmount))), ZERO);
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
    ) internal view returns (FPI.FixedPointInt memory) {
        // if long strike == 0, return short amount
        if (_longStrike.isEqual(ZERO)) {
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
        FPI.FixedPointInt memory secondPart = FPI.max(_shortAmount.sub(_longAmount), ZERO);

        return FPI.max(firstPart, secondPart);
    }

    /**
     * @dev calculate cash value for an expired put spread vault.
     *
     * Formula: net = (short cash value * short amount) - ( long cash value * long Amount )
     *
     * @return cash value denominated in strike asset.
     */
    function _getExpiredSpreadCashValue(
        FPI.FixedPointInt memory _shortAmount,
        FPI.FixedPointInt memory _longAmount,
        FPI.FixedPointInt memory _shortCashValue,
        FPI.FixedPointInt memory _longCashValue
    ) internal pure returns (FPI.FixedPointInt memory) {
        return _shortCashValue.mul(_shortAmount).sub(_longCashValue.mul(_longAmount));
    }

    /**
     * @dev ensure that the vault contains
     * a) at most 1 asset type used as collateral,
     * b) at most 1 series of option used as the long option and
     * c) at most 1 series of option used as the short option.
     * @param _vault the vault to check.
     */
    function _checkIsValidVault(MarginAccount.Vault memory _vault) internal view {
        // ensure all the arrays in the vault is valid
        require(_vault.shortOtokens.length <= 1, "MarginCalculator: Too many short otokens in the vault");
        require(_vault.longOtokens.length <= 1, "MarginCalculator: Too many long otokens in the vault");
        require(_vault.collateralAssets.length <= 1, "MarginCalculator: Too many collateral assets in the vault");

        require(
            _vault.shortOtokens.length == _vault.shortAmounts.length,
            "MarginCalculator: Short asset and amount mismatch"
        );
        require(
            _vault.longOtokens.length == _vault.longAmounts.length,
            "MarginCalculator: Long asset and amount mismatch"
        );
        require(
            _vault.collateralAssets.length == _vault.collateralAmounts.length,
            "MarginCalculator: Collateral asset and amount mismatch"
        );

        // ensure the long asset is valid for the short asset.
        require(_isMarginableLong(_vault), "MarginCalculator: long asset not marginable for short asset");

        // ensure that the collateral asset is valid for the short asset
        require(_isMarginableCollateral(_vault), "MarginCalculator: collateral asset not marginable for short asset");
    }

    /**
     * @dev if there is a short option in the vault, ensure that the long option series being used is a valid margin.
     * @param _vault the vault to check.
     */
    function _isMarginableLong(MarginAccount.Vault memory _vault) internal view returns (bool) {
        if (_isEmptyAssetArray(_vault.longOtokens) || _isEmptyAssetArray(_vault.shortOtokens)) return true;

        OtokenInterface long = OtokenInterface(_vault.longOtokens[0]);
        OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);

        return
            long.underlyingAsset() == short.underlyingAsset() &&
            long.strikeAsset() == short.strikeAsset() &&
            long.collateralAsset() == short.collateralAsset() &&
            long.expiryTimestamp() == short.expiryTimestamp() &&
            long.isPut() == short.isPut();
    }

    /**
     * @dev if there is a short option in the vault, ensure that the collateral asset being used is a valid margin.
     * @param _vault the vault to check.
     */
    function _isMarginableCollateral(MarginAccount.Vault memory _vault) internal view returns (bool) {
        if (_isEmptyAssetArray(_vault.collateralAssets) || _isEmptyAssetArray(_vault.shortOtokens)) return true;

        OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);

        return short.collateralAsset() == _vault.collateralAssets[0];
    }

    /**
     * @notice convert an amount in asset A to equivalent value of asset B, base on live price.
     * @dev this function include the amount and apply .mul() first to increase accuracy
     * @param _amount amount in asset A
     * @param _assetA asset A
     * @param _assetB asset B
     * @return _amount in asset B.
     */
    function _convertAmountOnLivePrice(
        FPI.FixedPointInt memory _amount,
        address _assetA,
        address _assetB
    ) internal view returns (FPI.FixedPointInt memory) {
        OracleInterface oracle = OracleInterface(AddressBookInterface(addressBook).getOracle());
        if (_assetA == _assetB) {
            return _amount;
        }
        uint256 priceA = oracle.getPrice(_assetA);
        uint256 priceB = oracle.getPrice(_assetB);
        return _amount.mul(_uintToFixedPoint(priceA, BASE)).div(_uintToFixedPoint(priceB, BASE));
    }

    /**
     * @notice convert an amount in asset A to equivalent value of asset B, base on expiry price
     * @dev this function include the amount and apply .mul() first to increase accuracy
     * @param _amount amount in asset A
     * @param _assetA asset A
     * @param _assetB asset B
     * @return _amount in asset B.
     */
    function _convertAmountOnExpiryPrice(
        FPI.FixedPointInt memory _amount,
        address _assetA,
        address _assetB,
        uint256 _expiry
    ) internal view returns (FPI.FixedPointInt memory) {
        OracleInterface oracle = OracleInterface(AddressBookInterface(addressBook).getOracle());
        if (_assetA == _assetB) {
            return _amount;
        }
        (uint256 priceA, bool priceAFinalized) = oracle.getExpiryPrice(_assetA, _expiry);
        (uint256 priceB, bool priceBFinalized) = oracle.getExpiryPrice(_assetB, _expiry);
        require(priceAFinalized && priceBFinalized, "MarginCalculator: price at expiry not finalized yet.");
        return _amount.mul(_uintToFixedPoint(priceA, BASE)).div(_uintToFixedPoint(priceB, BASE));
    }

    /**
     * @dev check if array is empty or only have address(0)
     * @return isEmpty or not
     */
    function _isEmptyAssetArray(address[] memory _assets) internal pure returns (bool) {
        return _assets.length == 0 || _assets[0] == address(0);
    }

    /**
     * @notice Constructs an `FixedPointInt` from an unscaled uint which has {_decimals} decimals
     * Examples:
     * (1)  USDC    decimals = 6
     *      Input:  8000000 USDC  =>    Output: 8 * 1e18 (FixedPoint 8.0 USDC)
     * (2)  cUSDC   decimals = 8
     *      Input:  8000000 cUSDC =>    Output: 8 * 1e16 (FixedPoint 0.08 cUSDC)
     * (3)  rUSD    decimals = 20 (random USD)
     *      Input:  15            =>   Output:  0
     * @param _num uint256 to convert into a FixedPoint.
     * @param _decimals the origianl decimals the number has.
     * @return the converted FixedPoint, with 18 decimals.
     */
    function _uintToFixedPoint(uint256 _num, uint256 _decimals) internal pure returns (FPI.FixedPointInt memory) {
        return (_num.uintToInt()).fromScaledInt(_decimals);
    }

    /**
     * @notice Convert a FixedPointInt256 back to uint256 amount with {_decimals} decimals
     * @param _num FixedPointInt to convert back to uint256.
     * @param _decimals target number decimals
     * @return the uint256 amount.
     */
    function _fixedPointToUint(FPI.FixedPointInt memory _num, uint256 _decimals) internal pure returns (uint256) {
        return (_num.toScaledInt(_decimals)).intToUint();
    }
}
