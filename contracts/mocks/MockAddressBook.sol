// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

contract MockAddressBook {
    address private _otokenImpl;
    address private _whitelist;
    address private _otokenFactoryImpl;
    address private _oracle;
    address private _controllerImpl;
    address private _oracleImpl;
    address private _calculatorImpl;
    address private _marginPool;

    function setOtokenImpl(address _newImpl) external {
        _otokenImpl = _newImpl;
    }

    function setWhitelist(address _newImpl) external {
        _whitelist = _newImpl;
    }

    function setOtokenFactory(address _otokenFactory) external {
        _otokenFactoryImpl = _otokenFactory;
    }

    function setController(address _controller) external {
        _controllerImpl = _controller;
    }

    function setOracle(address _oracleAddr) external {
        _oracleImpl = _oracleAddr;
    }

    function setMarginCalculator(address _calculator) external {
        _calculatorImpl = _calculator;
    }

    function setMarginPool(address _pool) external {
        _marginPool = _pool;
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

    function getOracle() external view returns (address) {
        return _oracleImpl;
    }

    function getController() external view returns (address) {
        return _controllerImpl;
    }

    function getMarginCalculator() external view returns (address) {
        return _calculatorImpl;
    }

    function getMarginPool() external view returns (address) {
        return _marginPool;
    }
}
