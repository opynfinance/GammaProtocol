// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

contract MockAddressBook {
    address private otokenImpl;
    address private whitelist;
    address private factory;
    address private controller;

    function setOtokenImpl(address _newImpl) external {
        otokenImpl = _newImpl;
    }

    function setWhitelist(address _whitelist) external {
        whitelist = _whitelist;
    }

    function setOtokenFactory(address _otokenFactory) external {
        factory = _otokenFactory;
    }

    function setController(address _controller) external {
        controller = _controller;
    }

    function getOtokenImpl() external view returns (address) {
        return otokenImpl;
    }

    function getWhitelist() external view returns (address) {
        return whitelist;
    }

    function getOtokenFactory() external view returns (address) {
        return factory;
    }

    function getController() external view returns (address) {
        return controller;
    }
}
