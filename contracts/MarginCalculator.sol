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
import {MarginVault} from "./libs/MarginVault.sol";

/**
 * @title MarginCalculator
 * @author Opyn
 * @notice Calculator module that check if a given vault is valid.
 */
contract MarginCalculator {
    using SafeMath for uint256;
    using FPI for FPI.FixedPointInt;

    address public addressBook;

    uint256 internal constant BASE = 8;
    FPI.FixedPointInt internal ZERO = FPI.fromScaledUint(0, BASE);

    constructor(address _addressBook) public {
        require(_addressBook != address(0), "MarginCalculator: invalid addressbook");

        addressBook = _addressBook;
    }

    /**
     * @notice Return the net worth of an expired oToken, denominated in collateral.
     * @param _otoken otoken address
     * @return the exchange rate that shows how much collateral unit can be take out by 1 otoken unit, scaled by 1e8.
     * Or how much collateral can be taken out for 1 (1e8) otoken
     */
    function getExpiredPayoutRate(address _otoken) external view returns (uint256) {
        require(_otoken != address(0), "MarginCalculator: Invalid token address");
        OtokenInterface otoken = OtokenInterface(_otoken);
        require(now > otoken.expiryTimestamp(), "MarginCalculator: Otoken not expired yet");

        FPI.FixedPointInt memory cashValueInStrike = _getExpiredCashValue(_otoken);

        address strike = otoken.strikeAsset();
        address collateral = otoken.collateralAsset();

        uint256 expiry = otoken.expiryTimestamp();

        FPI.FixedPointInt memory cashValueInCollateral = _convertAmountOnExpiryPrice(
            cashValueInStrike,
            strike,
            collateral,
            expiry
        );

        // the exchangeRate was scaled by 1e8, if 1e8 otoken can take out 1 USDC, the exchangeRate is currently 1e18
        // we want to return: how much USDC unit can be take out by 1 (1e8 units) otoken
        uint256 collateralDecimals = uint256(ERC20Interface(collateral).decimals());
        return cashValueInCollateral.toScaledUint(collateralDecimals, true);
    }

    /**
     * @notice returns the amount of collateral that owner can take out from this vault.
     * @dev The return amount is denominated in the collateral asset for the otoken
     * @param _vault the theoretical vault that needs to be checked
     * @return excessCollateral the amount by which the margin is above or below the required amount.
     * @return isExcess True if there's excess margin in the vault. In this case, collateral can be taken out from the vault.
     * False if there is insufficient margin and additional collateral needs to be added to the vault to create the position.
     */
    function getExcessCollateral(MarginVault.Vault memory _vault) public view returns (uint256, bool) {
        // include all the checks for a vault
        _checkIsValidVault(_vault);

        bool hasCollateral = _isNotEmpty(_vault.collateralAssets);
        bool hasShort = _isNotEmpty(_vault.shortOtokens);
        bool hasLong = _isNotEmpty(_vault.longOtokens);

        // if the vault contains no otokens: return collateral value.
        if (!hasShort && !hasLong) {
            uint256 amount = hasCollateral ? _vault.collateralAmounts[0] : 0;
            return (amount, true);
        }

        FPI.FixedPointInt memory collateralAmount = ZERO;
        if (hasCollateral) {
            uint256 colllateralDecimals = ERC20Interface(_vault.collateralAssets[0]).decimals();
            collateralAmount = FPI.fromScaledUint(_vault.collateralAmounts[0], colllateralDecimals);
        }

        // get required margin, denominated in collateral
        FPI.FixedPointInt memory collateralRequired = _getMarginRequired(_vault);
        FPI.FixedPointInt memory excessCollateral = collateralAmount.sub(collateralRequired);

        bool isExcess = excessCollateral.isGreaterThanOrEqual(ZERO);

        address otoken = hasLong ? _vault.longOtokens[0] : _vault.shortOtokens[0];
        uint256 collateralDecimals = ERC20Interface(OtokenInterface(otoken).collateralAsset()).decimals();
        // if there's excess, truncate the tailing digits in excessCollateralExternal calculation
        uint256 excessCollateralExternal = excessCollateral.toScaledUint(collateralDecimals, isExcess);
        return (excessCollateralExternal, isExcess);
    }

    /**
     * @notice Return the cash value of an expired oToken, denominated in strike asset.
     * @dev For call return = Max (0, ETH Price - oToken.strike)
     * @dev For put return Max(0, oToken.strike - ETH Price)
     * @param _otoken otoken address
     * @return the cash value of an expired otoken, denominated in strike asset.
     */
    function _getExpiredCashValue(address _otoken) internal view returns (FPI.FixedPointInt memory) {
        OtokenInterface otoken = OtokenInterface(_otoken);

        // strike price is denominated in strike asset.
        FPI.FixedPointInt memory strikePrice = FPI.fromScaledUint(otoken.strikePrice(), BASE);

        // calculate the expiry convertion rate between strike and underlying
        FPI.FixedPointInt memory one = FPI.fromScaledUint(1, 0);

        FPI.FixedPointInt memory underlyingPriceInStrike = _convertAmountOnExpiryPrice(
            one, // underlying price denominated in underlying
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
    function _getMarginRequired(MarginVault.Vault memory _vault) internal view returns (FPI.FixedPointInt memory) {
        // The vault passed must have either long otoken or short otoken in it.
        bool hasShort = _isNotEmpty(_vault.shortOtokens);
        bool hasLong = _isNotEmpty(_vault.longOtokens);

        FPI.FixedPointInt memory shortAmount = hasShort ? FPI.fromScaledUint(_vault.shortAmounts[0], BASE) : ZERO;
        FPI.FixedPointInt memory longAmount = hasLong ? FPI.fromScaledUint(_vault.longAmounts[0], BASE) : ZERO;

        OtokenInterface otoken = hasShort
            ? OtokenInterface(_vault.shortOtokens[0])
            : OtokenInterface(_vault.longOtokens[0]);
        bool expired = now > otoken.expiryTimestamp();
        bool isPut = otoken.isPut();

        if (!expired) {
            FPI.FixedPointInt memory shortStrike = hasShort
                ? FPI.fromScaledUint(OtokenInterface(_vault.shortOtokens[0]).strikePrice(), BASE)
                : ZERO;
            FPI.FixedPointInt memory longStrike = hasLong
                ? FPI.fromScaledUint(OtokenInterface(_vault.longOtokens[0]).strikePrice(), BASE)
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
            FPI.FixedPointInt memory shortCashValue = hasShort ? _getExpiredCashValue(_vault.shortOtokens[0]) : ZERO;
            FPI.FixedPointInt memory longCashValue = hasLong ? _getExpiredCashValue(_vault.longOtokens[0]) : ZERO;

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
     * @dev returns the strike asset needed for a put spread with given short and long asset
     *
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
     * @dev returns the underlying asset needed for a call spread with given short and long asset
     *
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
        // max (short amount - long amount , 0)
        if (_longStrike.isEqual(ZERO)) {
            return FPI.max(_shortAmount.sub(_longAmount), ZERO);
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
     * @dev calculate cash value for an expired vault.
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
    function _checkIsValidVault(MarginVault.Vault memory _vault) internal view {
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
     * @dev if there is a short option and a long option in the vault, ensure that the long option series being used is a valid margin.
     * @param _vault the vault to check.
     */
    function _isMarginableLong(MarginVault.Vault memory _vault) internal view returns (bool) {
        bool hasLong = _isNotEmpty(_vault.longOtokens);
        bool hasShort = _isNotEmpty(_vault.shortOtokens);
        // if vault is missing long or short, return true.
        if (!hasLong || !hasShort) return true;

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
     * @dev if there is short option and collateral asset in the vault, ensure that the collateral asset being used is a valid margin.
     * @param _vault the vault to check.
     */
    function _isMarginableCollateral(MarginVault.Vault memory _vault) internal view returns (bool) {
        bool isMarginable = true;

        bool hasCollateral = _isNotEmpty(_vault.collateralAssets);
        if (!hasCollateral) return isMarginable;

        bool hasShort = _isNotEmpty(_vault.shortOtokens);
        bool hasLong = _isNotEmpty(_vault.longOtokens);

        if (hasShort) {
            OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);
            isMarginable = short.collateralAsset() == _vault.collateralAssets[0];
        } else if (hasLong) {
            OtokenInterface long = OtokenInterface(_vault.longOtokens[0]);
            isMarginable = long.collateralAsset() == _vault.collateralAssets[0];
        }

        return isMarginable;
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
        // amount A * price A in USD = amount B * price B in USD
        // amount B = amount A * price A / price B
        return _amount.mul(FPI.fromScaledUint(priceA, BASE)).div(FPI.fromScaledUint(priceB, BASE));
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
        if (_assetA == _assetB) {
            return _amount;
        }
        OracleInterface oracle = OracleInterface(AddressBookInterface(addressBook).getOracle());
        (uint256 priceA, bool priceAFinalized) = oracle.getExpiryPrice(_assetA, _expiry);
        (uint256 priceB, bool priceBFinalized) = oracle.getExpiryPrice(_assetB, _expiry);
        require(priceAFinalized && priceBFinalized, "MarginCalculator: price at expiry not finalized yet.");
        // amount A * price A in USD = amount B * price B in USD
        // amount B = amount A * price A / price B
        return _amount.mul(FPI.fromScaledUint(priceA, BASE)).div(FPI.fromScaledUint(priceB, BASE));
    }

    /**
     * @dev check if asset array contain a token address.
     * @return true if the array is not empty
     */
    function _isNotEmpty(address[] memory _assets) internal pure returns (bool) {
        return _assets.length > 0 && _assets[0] != address(0);
    }
}
