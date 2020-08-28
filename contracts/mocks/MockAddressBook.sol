// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

contract MockAddressBook {
    address private _otokenImpl;
    address private _whitelist;
    address private _otokenFactoryImpl;
    address private _weth;
    address private _controllerImpl;
    address private _oracleImpl;
    address private _calculatorImpl;

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

    function setController(address _controller) external {
        _controllerImpl = _controller;
    }

    function setOracle(address _oracle) external {
        _oracleImpl = _oracle;
    }

    function setMarginCalculator(address _calculator) external {
        _calculatorImpl = _calculator;
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

    function getWeth() external view returns (address) {
        return _weth;
    }

    function getController() external view returns (address) {
        return _controllerImpl;
    }

    function getOracle() external view returns (address) {
        return _oracleImpl;
    }

    function getMarginCalculator() external view returns (address) {
        return _calculatorImpl;
    }
}
