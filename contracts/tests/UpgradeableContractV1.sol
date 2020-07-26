/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import "../packages/openzeppelin-upgradeability/VersionedInitializable.sol";

/**
 * @author Opyn Team
 * @notice Upgradeable testing contract
 */
contract UpgradeableContractV1 is VersionedInitializable {
    uint256 public constant CONTRACT_REVISION = 0x1;

    address public addressBook;

    function getRevision() internal override pure returns (uint256) {
        return CONTRACT_REVISION;
    }

    /**
     * @dev this function is invoked by the proxy contract when this contract is added to the
     * AddressBook.
     * @param _addressBook the address of the AddressBook
     **/
    function initialize(address _addressBook) public initializer {
        addressBook = _addressBook;
    }
}
