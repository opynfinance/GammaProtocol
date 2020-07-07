// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

contract MockAddressBook {
    address private _otokenImpl;
    address private _whitelist;

    constructor(address _otoken, address _whitelistModule) public {
        _otokenImpl = _otoken;
        _whitelist = _whitelistModule;
    }

    function getOtokenImpl() external returns (address) {
        return _otokenImpl;
    }

    function getWhitelist() external returns (address) {
        return _whitelist;
    }
}
