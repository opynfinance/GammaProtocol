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
import {MarginAccount} from "./libs/MarginAccount.sol";

/**
 *
 */
contract MarginCalculator is Initializable {
    using SafeMath for uint256;
    using FixedPointInt256 for int256;
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
     * @param _vault _vault the theoretical vault that needs to be checked
     * @param _demonimated _denominated the token the result is denominated in. Must be the same as short.collateral for now.
     * @return netValue the amount by which the margin is above or below the required amount.
     * @return isExcess true if there's excess margin in the vault. In this case, collateral can be taken out from the vault. False if there is insufficient margin and additional collateral needs to be added to the vault to create the position.
     */
    function getExcessMargin(MarginAccount.Vault memory _vault, address _demonimated)
        public
        view
        returns (uint256 netValue, bool isExcess)
    {
        // ensure the # asset in collateral, long and short array is valid.
        _checkAssetCount(_vault);
        // ensure the long asset is valid for the short asset.
        _checkLongAsset(_vault);

        // collateral amount is always positive.
        int256 collateralAmount = _vault.collateralAmounts.length > 0
            ? FixedPointInt256.uintToInt(_vault.collateralAmounts[0])
            : 0;

        // Vault contains no short tokens: return collateral value.
        if (_vault.shortOtokens.length == 0) return (collateralAmount.intToUint(), true);

        // For the currenct version, ensure denominated == short.collateral
        address shortCollateral = OtokenInterface(_vault.shortOtokens[0]).collateralAsset();
        require(shortCollateral == _demonimated, "MarginCalculator: Denomintated token should be short.collateral");

        int256 netOtoken = _calculateOtokenNetValue(_vault);
        // if netOtoken < 0, the long assets cannot cover the max loss of short assets in the vault.
        // will need to check if collateral + netOtoken is greater than 0.
        int256 totalValue = collateralAmount.add(netOtoken);
        isExcess = totalValue >= 0;
        netValue = totalValue.intToUint();
    }

    /**
     * @notice Calculate the net value of long token + short token in a vault, denominated in collateral asset.
     * @dev The vault passed in already pass amount array length = asset array length check.
     * @param _vault the theoretical vault that needs to be checked
     * @return netOtoken net worth of long otoken and short otoken, denominated in collateral asset.
     * Positive: long asset covers the max loss of short asset. Can potentially remove collateral.
     * Negative: long asset cannot cover the max loss of short asset, will take collateral assets amount into consideration
     *           to see if the vault is valid.
     */
    function _calculateOtokenNetValue(MarginAccount.Vault memory _vault) internal view returns (int256 netOtoken) {
        // The vault passed in has a short array == 1, so we can just use shortAmounts[0]
        int256 shortAmount = FixedPointInt256.uintToInt(_vault.shortAmounts[0]);

        bool hasLongInVault = _vault.longOtokens.length > 0;
        int256 longAmount = hasLongInVault ? FixedPointInt256.uintToInt(_vault.longAmounts[0]) : 0;

        OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);
        bool expired = now > short.expiryTimestamp();
        bool isPut = short.isPut();

        if (!expired) {
            int256 shortStrike = FixedPointInt256.uintToInt(short.strikePrice());
            int256 longStrike = hasLongInVault
                ? FixedPointInt256.uintToInt(OtokenInterface(_vault.longOtokens[0]).strikePrice())
                : 0;

            if (isPut) {
                netOtoken = _calculateNonExpiredPutNetValue(shortAmount, longAmount, shortStrike, longStrike);
            } else {
                netOtoken = _calculateNonExpiredCallNetValue(shortAmount, longAmount, shortStrike, longStrike);
            }
        } else {
            int256 shortCashValue = FixedPointInt256.uintToInt(getExpiredCashValue(address(short)));
            int256 longCashValue = hasLongInVault
                ? FixedPointInt256.uintToInt(getExpiredCashValue(_vault.longOtokens[0]))
                : 0;

            if (isPut) {
                netOtoken = _calculateExpiredPutNetValue(shortAmount, longAmount, shortCashValue, longCashValue);
            } else {
                (uint256 underlyingPrice, ) = _getUnderlyingPrice(address(short));
                int256 underlyingPriceInt = FixedPointInt256.uintToInt(underlyingPrice);
                netOtoken = _calculateExpiredCallNetValue(
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
     * @dev calculate non-expired net put spread value.
     *
     * Formula: net = (long strike * min (short amount, long amount)) - (short amount * short strike)
     *
     * @return net value
     */
    function _calculateNonExpiredPutNetValue(
        int256 _shortAmount,
        int256 _longAmount,
        int256 _shortStrike,
        int256 _longStrike
    ) internal pure returns (int256) {
        return _longStrike.mul(FixedPointInt256.min(_shortAmount, _longAmount)).sub(_shortAmount.mul(_shortStrike));
    }

    /**
     * @dev calculate non-expired net call spread value.
     *                                                min (long amount, short amount) * max (0, long strike - short strike)
     * net = min(0, long amount - short amount) -  --------------------------------------------------------------------------
     *                                                                             long strike
     *
     * @dev if long strike = 0 (no long token), then return net = short amount.
     * @return net value
     */
    function _calculateNonExpiredCallNetValue(
        int256 _shortAmount,
        int256 _longAmount,
        int256 _shortStrike,
        int256 _longStrike
    ) internal pure returns (int256) {
        if (_longStrike == 0) {
            return -_shortAmount;
        }
        return
            FixedPointInt256.min(0, _longAmount.sub(_shortAmount)).sub(
                FixedPointInt256
                    .min(_longAmount, _shortAmount)
                    .mul(FixedPointInt256.max(0, _longStrike.sub(_shortStrike)))
                    .div(_longStrike)
            );
    }

    /**
     * @dev calculate expired net put spread value.
     *
     * Formula: net = ( long cash value * long Amount ) - (short cash value * short amount)
     *
     * @return net value
     */
    function _calculateExpiredPutNetValue(
        int256 _shortAmount,
        int256 _longAmount,
        int256 _shortCashValue,
        int256 _longCashValue
    ) internal pure returns (int256) {
        return (_longCashValue.mul(_longAmount)).sub(_shortCashValue.mul(_shortAmount));
    }

    /**
     * @dev calculate expired net call spread value.
     *                     ( long cash value * long Amount ) - (short cash value * short amount)
     *  Formula: net =   -------------------------------------------------------------------------
     *                                               Underlying price
     * @return net value
     */
    function _calculateExpiredCallNetValue(
        int256 _shortAmount,
        int256 _longAmount,
        int256 _shortCashValue,
        int256 _longCashValue,
        int256 _underlyingPriceInt
    ) internal pure returns (int256) {
        return (_longCashValue.mul(_longAmount)).sub(_shortCashValue.mul(_shortAmount)).div(_underlyingPriceInt);
    }

    /**
     * @dev internal function that ensure each asset type & amout array have the same length, and length <= 1;
     * @param _vault the vault to check.
     */
    function _checkAssetCount(MarginAccount.Vault memory _vault) internal pure {
        // For the current version, check lengths of short, long, collateral <= 1.
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
     * @dev internal function that check the long asset is valid for the short asset
     * @param _vault the vault to check.
     */
    function _checkLongAsset(MarginAccount.Vault memory _vault) internal view {
        if (_vault.longOtokens.length == 0 || _vault.shortOtokens.length == 0) return;

        OtokenInterface long = OtokenInterface(_vault.longOtokens[0]);
        OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);
        require(_getBatchId(long) == _getBatchId(short), "MarginCalculator: Long and short batch mismatch");
    }

    /**
     * @dev internal function to get underlying price of an otoken.
     * @param _otoken otoken address
     * @return price the underlying asset price with 18 decimals
     * @return isFinalized the price is finalized by the oracle and can't be changed
     */
    function _getUnderlyingPrice(address _otoken) internal view returns (uint256 price, bool isFinalized) {
        OtokenInterface otoken = OtokenInterface(_otoken);
        bytes32 batchId = _getBatchId(otoken);
        OracleInterface oracle = OracleInterface(AddressBookInterface(addressBook).getOracle());
        return oracle.getBatchPrice(batchId, otoken.expiryTimestamp());
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
}
