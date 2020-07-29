/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

// import "../packages/oz/upgradeability/VersionedInitializable.sol";
import "../interfaces/OtokenInterface.sol";

/**
 * @author Opyn Team
 * @notice Upgradeable Controller testing contract
 */
contract TestController {
    /// @notice addressbook address
    address public addressBook;

    /**
     * @dev this function is invoked by the proxy contract when this contract is added to the
     * AddressBook.
     * @param _addressBook the address of the AddressBook
     **/
    function initialize(address _addressBook) external {
        addressBook = _addressBook;
    }

    /**
     * @dev this function is used to test if controller can mint otokens
     */
    function testMintOtoken(
        address _otoken,
        address _account,
        uint256 _amount
    ) external {
        OtokenInterface(_otoken).mintOtoken(_account, _amount);
    }

    /**
     * @dev this function is used to test if controller can mint otokens
     */
    function testBurnOtoken(
        address _otoken,
        address _account,
        uint256 _amount
    ) external {
        OtokenInterface(_otoken).burnOtoken(_account, _amount);
    }
}
