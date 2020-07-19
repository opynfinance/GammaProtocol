// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface IAddressBook {
    function getOtokenImpl() external view returns (address otoken);

    function getWhitelist() external view returns (address whitelist);
}
