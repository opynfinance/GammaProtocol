// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface AddressBookInterface {
    function getOtokenImpl() external view returns (address);

    function getWhitelist() external view returns (address);
}
