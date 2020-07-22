// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

contract MockAddressBook {
    address private _otokenFactoryImpl;

    function getOtokenFactory() external view returns (address) {
        return _otokenFactoryImpl;
    }

    function setOtokenFactory(address _otokenFactory) external {
        _otokenFactoryImpl = _otokenFactory;
    }
}
