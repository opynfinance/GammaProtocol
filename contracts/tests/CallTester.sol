/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 * @author Opyn Team
 * @notice Call action testing contract
 */
contract CallTester {
    event CallFunction(address sender, bytes data);

    function callFunction(address _sender, bytes memory _data) external {
        emit CallFunction(_sender, _data);
    }
}
