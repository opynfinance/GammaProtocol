/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import "../packages/oz/upgradeability/VersionedInitializable.sol";

/**
 * @author Opyn Team
 * @notice Upgradeable testing contract
 */
contract UpgradeableContractV1 is VersionedInitializable {
    /// @notice contract version
    uint256 public constant CONTRACT_REVISION = 0x1;
    /// @notice addressbook address
    address public addressBook;

    /**
     * @notice return current contract version
     * @dev should be implemented in all contracts that inherit VersionedInitializable
     */
    function getRevision() internal override pure returns (uint256) {
        return CONTRACT_REVISION;
    }

    /**
     * @dev this function is invoked by the proxy contract when this contract is added to the
     * AddressBook.
     * @param _addressBook the address of the AddressBook
     **/
    function initialize(address _addressBook) external initializer {
        addressBook = _addressBook;
    }
}
