/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 * @dev Contract interface that can be called from Controller as a call action.
 */
interface CalleeInterface {
    /**
     * Allows users to send this contract arbitrary data.
     * @param _sender The msg.sender to Controller
     * @param _vaultOwner The vault owner
     * @param _vaultId The vault id
     * @param _data Arbitrary data given by the sender
     */
    function callFunction(
        address payable _sender,
        address _vaultOwner,
        uint256 _vaultId,
        bytes memory _data
    ) external payable;
}
