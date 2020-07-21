/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 *
 */
// solhint-disable-next-line no-empty-blocks
library Actions {
    /// @notice Possible actions that can be performed
    enum ActionType {
        OpenVault,
        MintShortOption,
        BurnShortOption,
        DepositLongOption,
        WithdrawLongOption,
        DepositCollateral,
        WithdrawCollateral,
        Exercise,
        Call
    }

    struct ActionArgs {
        /// @notice The type of action that is being performed on the system
        ActionType actionType;
        /// @notice The address of the account owner
        address owner;
        /// @notice The address which we move assets from or to (depending on the action type)
        address sender;
        /// @notice The asset that is to be transfered
        address asset;
        /// @notice The address of the vault that is to be modified (if any)
        uint256 vaultId;
        /// @notice The amount of asset that is to be transfered
        uint256 amount;
        /**
         * @notice Each vault can hold multiple short / long / collateral assets. In this version, we are restricting the scope to only 1 of each.
         * In future versions this would be the index of the short / long / collateral asset that needs to be modified.
         */
        uint256 index;
        /// @notice Any other data that needs to be passed in for arbitrary function calls
        bytes data;
    }

    struct DepositArgs {
        /// @notice The address of the account owner
        address owner;
        /// @notice The address of the vault to which the asset will be added
        uint256 vaultId;
        /// @notice The address from which we transfer the asset
        address from;
        /// @notice The asset that is to be deposited
        address asset;
        /**
         * @notice Each vault can hold multiple short / long / collateral assets. In this version, we are restricting the scope to only 1 of each.
         * In future versions this would be the index of the short / long / collateral asset that needs to be modified.
         */
        uint256 index;
        /// @notice The amount of asset that is to be transfered
        uint256 amount;
    }
}
