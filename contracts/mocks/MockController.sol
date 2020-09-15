/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

// import "../packages/oz/upgradeability/VersionedInitializable.sol";
import "../interfaces/OtokenInterface.sol";

/**
 * @author Opyn Team
 * @notice Upgradeable Controller that can mock minting and burning calls from controller.
 */
contract MockController {
    /// @notice addressbook address
    address public addressBook;
    address public owner;

    /**
     * @dev this function is invoked by the proxy contract when this contract is added to the
     * AddressBook.
     * @param _addressBook the address of the AddressBook
     **/
    function initialize(address _addressBook, address _owner) external {
        addressBook = _addressBook;
        owner = _owner;
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
     * @dev this function is used to test if controller can burn otokens
     */
    function testBurnOtoken(
        address _otoken,
        address _account,
        uint256 _amount
    ) external {
        OtokenInterface(_otoken).burnOtoken(_account, _amount);
    }
}
