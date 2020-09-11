/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 * @author Opyn Team
 * @notice Call action testing contract
 */
contract CallTester {
    event CallFunction(address sender, address vaultOwner, uint256 vaultId, bytes data);

    function callFunction(
        address _sender,
        address _vaultOwner,
        uint256 _vaultId,
        bytes memory _data
    ) external {
        emit CallFunction(_sender, _vaultOwner, _vaultId, _data);
    }
}
