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
        // return 0 if address passed in is 0.
        if (_otoken == address(0)) return 0;

        OtokenInterface otoken = OtokenInterface(_otoken);
        uint256 strikePrice = otoken.strikePrice();
        (uint256 underlyingPrice, bool isFinalized) = _getUnerlyingPrice(_otoken);
        require(isFinalized, "MarginCalculator: Oracle price not finalized yet.");

        if (otoken.isPut()) {
            return strikePrice > underlyingPrice ? strikePrice.sub(underlyingPrice) : 0;
        } else {
            return underlyingPrice > strikePrice ? underlyingPrice.sub(strikePrice) : 0;
        }
    }

    /**
     * @notice return the net value of a vault in either USDC for puts/ ETH for calls
     */
    function getExcessMargin(Vault memory _vault, address _demonimated)
        public
        view
        returns (uint256 netValue, bool isExcess)
    {
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

        int256 collateralAmount = _vault.collateralAmounts.length > 0
            ? FixedPointInt256.uintToInt(_vault.collateralAmounts[0])
            : 0;
        int256 shortAmount = _vault.shortAmounts.length > 0 ? FixedPointInt256.uintToInt(_vault.shortAmounts[0]) : 0;
        int256 longAmount = _vault.longAmounts.length > 0 ? FixedPointInt256.uintToInt(_vault.longAmounts[0]) : 0;

        // No short tokens: return collateral value.
        if (_vault.shortOtokens.length == 0) return (collateralAmount.intToUint(), true);

        address short = _vault.shortOtokens[0];

        // For the currenct version, ensure denominated == short.collateral
        require(
            OtokenInterface(short).collateralAsset() == _demonimated,
            "MarginCalculator: Denomintated token should be short.collateral"
        );

        bool expired = now > OtokenInterface(short).expiryTimestamp();
        bool isPut = OtokenInterface(short).isPut();
        int256 netOtoken = 0;
        if (expired) {
            address long = _vault.longOtokens.length > 0 ? _vault.longOtokens[0] : address(0);
            int256 shortCashValue = FixedPointInt256.uintToInt(getExpiredCashValue(short));
            int256 longCashValue = FixedPointInt256.uintToInt(getExpiredCashValue(long));

            // Net otoken value = long cash value * long amount - short cash value * short amount;
            int256 netOtokenAfterExpiry = (longCashValue.mul(longAmount)).sub(shortCashValue.mul(shortAmount));

            if (isPut) {
                /*
                 * Put otoken net after expiry: same as above:
                 * long cash value * long amount - short cash value * short amount)
                 */
                netOtoken = netOtokenAfterExpiry;
            } else {
                /*
                 * Call otoken net after expiry: (net otoken value / underlying price)
                 */
                (uint256 underlyingPrice, ) = _getUnerlyingPrice(address(short));
                // todo: do we need to check isFinalized?
                int256 underlyingPirceInt = FixedPointInt256.uintToInt(underlyingPrice);
                netOtoken = netOtokenAfterExpiry.div(underlyingPirceInt);
            }
        } else {
            int256 shortStrike = FixedPointInt256.uintToInt(OtokenInterface(short).strikePrice());

            // if not long asset, set long strike = 0
            int256 longStrike = 0;
            if (_vault.shortOtokens.length > 0)
                longStrike = FixedPointInt256.uintToInt(OtokenInterface(_vault.longOtokens[0]).strikePrice());

            if (isPut) {
                /**
                 * Net otoken value for put =
                 * (longOToken.strikePrice * min (short amount, long amount)) - (short amount * short strike)
                 */
                netOtoken = longStrike.mul(FixedPointInt256.min(shortAmount, longAmount)).sub(
                    shortAmount.mul(shortStrike)
                );
            } else {
                /**
                 * Net otoken value for call =
                 * Min(amount of long option, amount of short option) *
                 *      Max(0, long strike - short strike) / long strike)
                 * - Min(0, long amount - short amount)
                 */
                netOtoken = FixedPointInt256
                    .min(longAmount, shortAmount)
                    .mul(FixedPointInt256.max(0, longStrike.sub(shortStrike)))
                    .div(longStrike)
                    .sub(FixedPointInt256.min(0, longAmount.sub(shortAmount)));
            }
        }

        int256 net = collateralAmount.add(netOtoken);
        isExcess = net > 0;
        netValue = net.intToUint();
    }

    /**
     * @dev internal function to get underlying price of an otoken.
     */
    function _getUnerlyingPrice(address _otoken) internal view returns (uint256 price, bool isFinalized) {
        OtokenInterface otoken = OtokenInterface(_otoken);
        bytes32 batchId = _getBatchId(otoken);
        OracleInterface oracle = OracleInterface(AddressBookInterface(addressBook).getOracle());
        return oracle.getPrice(batchId, otoken.expiryTimestamp());
    }

    /**
     * @dev internal function to hash paramters and get batch id. Each option has a unique id.
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
