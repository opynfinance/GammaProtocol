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
    address public addressBook;
    // TODO: remove this
    address public _oracle;

    function init(address _addressBook) external initializer {
        addressBook = _addressBook;
    }

    /**
     * @dev Return the cash value of an expired oToken.
     * @param _otoken otoken address
     */
    function getExpiredCashValue(address _otoken) public view returns (uint256) {
        bytes32 batchId = _getBatchId(_otoken);

        OtokenInterface otoken = OtokenInterface(_otoken);
        uint256 strikePrice = otoken.strikePrice();

        // OracleInterface oracle = OracleInterface(AddressBookInterface(addressBook).getOracle());
        OracleInterface oracle = OracleInterface(_oracle);
        (uint256 underlyingPrice, bool isFinalized) = oracle.getPrice(batchId, otoken.expiryTimestamp());

        require(isFinalized, "MarginCalculator: Oracle price not finalized yet.");

        if (otoken.isPut()) {
            return strikePrice > underlyingPrice ? strikePrice.sub(underlyingPrice) : 0;
        } else {
            return underlyingPrice > strikePrice ? underlyingPrice.sub(strikePrice) : 0;
        }
    }

    // function getExcessMargin(Vault memory vault, address demonimated) public view returns (uint256, bool isExcess) {

    // }

    /**
     * @dev internal function to hash paramters and get batch id. Each option has a unique id.
     * @param _otoken otoken address
     * @return id the batchDd of an otoken
     */
    function _getBatchId(address _otoken) internal pure returns (bytes32 id) {
        OtokenInterface otoken = OtokenInterface(_otoken);
        id = keccak256(
            abi.encodePacked(otoken.underlyingAsset, otoken.strikeAsset, otoken.collateralAsset, otoken.expiry)
        );
    }
}
