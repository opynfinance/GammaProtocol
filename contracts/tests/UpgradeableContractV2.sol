/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import {Initializable} from "../packages/oz/upgradeability/Initializable.sol";

/**
 * @author Opyn Team
 * @notice Upgradeable testing contract
 */
contract UpgradeableContractV2 is Initializable {
    /// @notice addressbook address
    address public addressBook;
    /// @notice owner address
    address public owner;
    // new constant added here to follow same slot order
    uint256 public constant CONTRACT_REVISION = 0x2;

    /**
     * @dev this function is invoked by the proxy contract when this contract is added to the
     * AddressBook.
     * @param _addressBook the address of the AddressBook
     **/
    function initialize(address _addressBook, address _owner) public initializer {
        addressBook = _addressBook;
        owner = _owner;
    }

    /**
     * @notice return current contract version
     * @dev should be implemented in all contracts that inherit VersionedInitializable
     */
    function getRevision() external pure returns (uint256) {
        return CONTRACT_REVISION;
    }
}
