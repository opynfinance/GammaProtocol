// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

contract MockAddressBook {
    address private _otokenImpl;
    address private _whitelist;
    address private _otokenFactoryImpl;
    address private _controllerImpl;

    function setOtokenImpl(address _newImpl) external {
        _otokenImpl = _newImpl;
    }

    function setWhitelist(address _newImpl) external {
        _whitelist = _newImpl;
    }

    function getOtokenImpl() external view returns (address) {
        return _otokenImpl;
    }

    function getWhitelist() external view returns (address) {
        return _whitelist;
    }

    function getOtokenFactory() external view returns (address) {
        return _otokenFactoryImpl;
    }

    function getController() external view returns (address) {
        return _controllerImpl;
    }

    function setOtokenFactory(address _otokenFactory) external {
        _otokenFactoryImpl = _otokenFactory;
    }

    function setController(address _controller) external {
        _controllerImpl = _controller;
    }
}
