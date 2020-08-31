/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;
pragma experimental ABIEncoderV2;

import {Initializable} from "./packages/oz/upgradeability/Initializable.sol";
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
contract MarginCalculator is Initializable {
    using SafeMath for uint256;
    using FixedPointInt256 for FixedPointInt256.FixedPointInt;
    address public addressBook;

    function init(address _addressBook) external initializer {
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
     * @param _denominated the token the result is denominated in. Must be the same as short.collateral for now.
     * @return netValue the amount by which the margin is above or below the required amount.
     * @return isExcess true if there's excess margin in the vault. In this case, collateral can be taken out from the vault. False if there is insufficient margin and additional collateral needs to be added to the vault to create the position.
     */
    function getExcessMargin(MarginAccount.Vault memory _vault, address _denominated)
        public
        view
        returns (uint256, bool)
    {
        // ensure the number of collateral, long and short array is valid.
        _checkIsValidSpread(_vault);
        // ensure the long asset is valid for the short asset.
        require(_isMarginableLong(_vault), "MarginCalculator: long asset not marginable for short asset");

        // collateral amount is always positive.
        FixedPointInt256.FixedPointInt memory collateralAmount = (_vault.collateralAssets.length == 0) ||
            (_vault.collateralAssets[0] == address(0))
            ? _uint256ToFixedPointInt(0)
            : _uint256ToFixedPointInt(_vault.collateralAmounts[0]);

        // Vault contains no short tokens: return collateral value.
        if (_vault.shortOtokens.length == 0 || _vault.shortOtokens[0] == address(0))
            return (SignedConverter.intToUint(collateralAmount.value), true);

        // For the currenct version, ensure denominated == short.collateral
        address shortCollateral = OtokenInterface(_vault.shortOtokens[0]).collateralAsset();
        require(
            shortCollateral == _denominated,
            "MarginCalculator: Denomintated token should be the short otoken's collateral"
        );

        FixedPointInt256.FixedPointInt memory marginRequirement = _getMarginRequired(_vault);
        // if marginRequirement > 0, the long assets cannot cover the max loss of short assets in the vault.
        // will need to check if collateral - marginRequirement is greater than 0.
        FixedPointInt256.FixedPointInt memory excessMargin = collateralAmount.sub(marginRequirement);
        bool isExcess = excessMargin.isGreaterThanOrEqual(_uint256ToFixedPointInt(0));
        uint256 netValue = SignedConverter.intToUint(excessMargin.value);
        return (netValue, isExcess);
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

    /**
     * @dev calculate spread margin requirement.
     * @dev this value is used
     * marginRequired = max( (short amount * short strike) - (long strike * min (short amount, long amount)) , 0 )
     *
     * @return net value
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
     * @return net value
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
     * @return net value
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
     * @return net value
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
        if (_vault.longOtokens.length == 0 || _vault.shortOtokens.length == 0) return true;

        OtokenInterface long = OtokenInterface(_vault.longOtokens[0]);
        OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);
        bool isMarginable = long.underlyingAsset() == short.underlyingAsset() &&
            long.strikeAsset() == short.strikeAsset() &&
            long.collateralAsset() == short.collateralAsset() &&
            long.expiryTimestamp() == short.expiryTimestamp();

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
     * @dev internal function to hash paramters and get batch id. Same batch id means same product with same expiry.
     * @param _otoken otoken address
     * @return id the batchDd of an otoken
     */
    function _getBatchId(OtokenInterface _otoken) internal view returns (bytes32 id) {
        id = keccak256(
            abi.encodePacked(
                _otoken.underlyingAsset(),
                _otoken.strikeAsset(),
                _otoken.collateralAsset(),
                _otoken.expiryTimestamp()
            )
        );
    }

    function _uint256ToFixedPointInt(uint256 _num) internal pure returns (FixedPointInt256.FixedPointInt memory) {
        return FixedPointInt256.FixedPointInt(SignedConverter.uintToInt(_num));
    }
}
