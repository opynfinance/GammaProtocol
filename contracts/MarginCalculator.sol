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

// TODO: use this from libs/MarginAccout
struct Vault {
    uint256[] shortAmounts;
    uint256[] longAmounts;
    uint256[] collateralAmounts;
    address[] shortOtokens;
    address[] longOtokens;
    address[] collateralAssets;
}

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
     */
    function getExpiredCashValue(address _otoken) public view returns (uint256) {
        require(_otoken != address(0), "MarginCalculator: Can't calculate cash value for non-otokens.");

        OtokenInterface otoken = OtokenInterface(_otoken);
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
     * @notice return the net value of a vault in either USDC for puts/ ETH for calls
     * @param _vault the vault that need to be checked
     * @param _demonimated the token to denominated the result in. Must be the same as short.collateral for now.
     * @return netValue excess margin or margin requirement amount.
     * @return isExcess true if there's excess margin in the vault, false if the return amount is margin requirement.
     */
    function getExcessMargin(Vault memory _vault, address _demonimated)
        public
        view
        returns (uint256 netValue, bool isExcess)
    {
        _checkAssetCount(_vault);
        _checkLongAsset(_vault);

        int256 collateralAmount = _vault.collateralAmounts.length > 0
            ? FixedPointInt256.uintToInt(_vault.collateralAmounts[0])
            : 0;

        // Vault contains no short tokens: return collateral value.
        if (_vault.shortOtokens.length == 0) return (collateralAmount.intToUint(), true);

        address short = _vault.shortOtokens[0];
        // For the currenct version, ensure denominated == short.collateral
        require(
            OtokenInterface(short).collateralAsset() == _demonimated,
            "MarginCalculator: Denomintated token should be short.collateral"
        );

        int256 shortAmount = _vault.shortAmounts.length > 0 ? FixedPointInt256.uintToInt(_vault.shortAmounts[0]) : 0;
        int256 longAmount = _vault.longAmounts.length > 0 ? FixedPointInt256.uintToInt(_vault.longAmounts[0]) : 0;

        bool expired = now > OtokenInterface(short).expiryTimestamp();
        bool isPut = OtokenInterface(short).isPut();
        int256 netOtoken = 0;
        if (expired) {
            int256 shortCashValue = FixedPointInt256.uintToInt(getExpiredCashValue(short));
            int256 longCashValue = 0;
            if (_vault.longOtokens.length > 0)
                longCashValue = FixedPointInt256.uintToInt(getExpiredCashValue(_vault.longOtokens[0]));

            // Net otoken value = (long cash value * long amount) - (short cash value * short amount)
            int256 netOtokenAfterExpiry = (longCashValue.mul(longAmount)).sub(shortCashValue.mul(shortAmount));

            if (isPut) {
                /*
                 * Put otoken net after expiry: same as above:
                 *     (long cash value * long amount) - (short cash value * short amount)
                 */
                netOtoken = netOtokenAfterExpiry;
            } else {
                /*
                 * Call otoken net after expiry: (net otoken value / underlying price)
                 */
                (uint256 underlyingPrice, ) = _getUnderlyingPrice(address(short));
                // todo: do we need to check isFinalized?
                int256 underlyingPirceInt = FixedPointInt256.uintToInt(underlyingPrice);
                netOtoken = netOtokenAfterExpiry.div(underlyingPirceInt);
            }
        } else {
            // If option is not expired yet.
            int256 shortStrike = FixedPointInt256.uintToInt(OtokenInterface(short).strikePrice());

            // long otoken strike price, set to 0 if there's not long assets.
            int256 longStrike = 0;
            if (_vault.longOtokens.length > 0)
                longStrike = FixedPointInt256.uintToInt(OtokenInterface(_vault.longOtokens[0]).strikePrice());

            if (isPut) {
                /**
                 * Net otoken value for put =
                 *     (long strike * min (short amount, long amount)) - (short amount * short strike)
                 */
                netOtoken = longStrike.mul(FixedPointInt256.min(shortAmount, longAmount)).sub(
                    shortAmount.mul(shortStrike)
                );
            } else {
                /**
                 * Net otoken value for call =
                 *     Min(0, long amount - short amount)
                 *         - Min(long amount, short amount) * Max(0, long strike - short strike) / long strike)
                 */
                if (longStrike == 0) {
                    // no long otoken
                    netOtoken = -shortAmount;
                } else {
                    netOtoken = FixedPointInt256.min(0, longAmount.sub(shortAmount)).sub(
                        FixedPointInt256
                            .min(longAmount, shortAmount)
                            .mul(FixedPointInt256.max(0, longStrike.sub(shortStrike)))
                            .div(longStrike)
                    );
                }
            }
        }

        int256 net = collateralAmount.add(netOtoken);
        isExcess = net >= 0;
        netValue = net.intToUint();
    }

    /**
     * @dev internal function that ensure each asset type & amout array have the same length, and length <= 1;
     * @param _vault the vault to check.
     */
    function _checkAssetCount(Vault memory _vault) internal pure {
        // For the currect version, check lengths of short, long, ollateral <= 1.
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
    function _checkLongAsset(Vault memory _vault) internal view {
        if (_vault.longOtokens.length == 0 || _vault.shortOtokens.length == 0) return;

        OtokenInterface long = OtokenInterface(_vault.longOtokens[0]);
        OtokenInterface short = OtokenInterface(_vault.shortOtokens[0]);

        require(long.expiryTimestamp() == short.expiryTimestamp(), "MarginCalculator: Short and Long expiry mismatch.");
        require(
            long.underlyingAsset() == short.underlyingAsset(),
            "MarginCalculator: Short and Long underlying mismatch."
        );
        require(long.strikeAsset() == short.strikeAsset(), "MarginCalculator: Short and Long strike mismatch.");
        require(
            long.collateralAsset() == short.collateralAsset(),
            "MarginCalculator: Short and Long collateral mismatch."
        );
    }

    /**
     * @dev internal function to get underlying price of an otoken.
     * @param _otoken otoken address
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
