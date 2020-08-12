// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

contract MockAddressBook {
    address private _otokenImpl;
    address private _whitelist;
    address private _otokenFactoryImpl;
    address private _oracle;
    address private _weth;
    address private _controllerImpl;

    function getOtokenImpl() external view returns (address) {
        return _otokenImpl;
    }

    function getWhitelist() external view returns (address) {
        return _whitelist;
    }

    function getOtokenFactory() external view returns (address) {
        return _otokenFactoryImpl;
    }

    function getOracle() external view returns (address) {
        return _oracle;
    }

    function getWeth() external view returns (address) {
        return _weth;
    }

    function getController() external view returns (address) {
        return _controllerImpl;
    }

    function setOtokenImpl(address _newImpl) external {
        _otokenImpl = _newImpl;
    }

    function setWhitelist(address _newImpl) external {
        _whitelist = _newImpl;
    }

    function setOtokenFactory(address _otokenFactory) external {
        _otokenFactoryImpl = _otokenFactory;
    }

    function setWeth(address _wethAdd) external {
        _weth = _wethAdd;
    }

    function setOracle(address _oracleAddr) external {
        _oracle = _oracleAddr;
    }

    function setController(address _controller) external {
        _controllerImpl = _controller;
    }
}
