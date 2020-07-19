// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

/**
 * @author Opyn Team
 * @title AddressBook interface
 */
interface IAddressBook {
    function getOtokenFactory() external view returns (address);
}
