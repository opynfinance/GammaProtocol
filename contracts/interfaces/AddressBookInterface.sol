// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface AddressBookInterface {
    function getOtokenFactory() external view returns (address);

    function setOtokenFactory(address _otokenFactory) external;
}
