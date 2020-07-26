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
        SettleVault,
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
        /// @notice The index of the vault that is to be modified (if any)
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
        /// @notice The index of the vault to which the asset will be added
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

    struct WithdrawArgs {
        /// @notice The address of the account owner
        address owner;
        /// @notice The index of the vault from which the asset will be withdrawn
        uint256 vaultId;
        /// @notice The address to which we transfer the asset
        address to;
        /// @notice The asset that is to be withdrawn
        address asset;
        /**
         * @notice Each vault can hold multiple short / long / collateral assets. In this version, we are restricting the scope to only 1 of each.
         * In future versions this would be the index of the short / long / collateral asset that needs to be modified.
         */
        uint256 index;
        /// @notice The amount of asset that is to be transfered
        uint256 amount;
    }

    /**
     * @notice Parses the passed in action argmuents to get the argmuents for a deposit action
     * @param _args The general action arguments structure
     * @return The arguments for a deposit action
     */
    function _parseDepositArgs(ActionArgs memory _args) internal returns (DepositArgs memory) {
        require(
            (_args.actionType == ActionType.DepositLongOption) || (_args.actionType == ActionType.DepositCollateral),
            "Actions: can only parse arguments for deposit actions"
        );
        require(_args.owner != address(0), "Actions: cannot deposit to an invalid account");

        return
            DepositArgs({
                owner: _args.owner,
                vaultId: _args.vaultId,
                from: _args.sender,
                asset: _args.asset,
                index: _args.index,
                amount: _args.amount
            });
    }

    /**
     * @notice Parses the passed in action argmuents to get the argmuents for a withdraw action
     * @param _args The general action arguments structure
     * @return The arguments for a withdraw action
     */
    function _parseWithdrawArgs(ActionArgs memory _args) internal returns (WithdrawArgs memory) {
        require(
            (_args.actionType == ActionType.WithdrawLongOption) || (_args.actionType == ActionType.WithdrawCollateral),
            "Actions: can only parse arguments for withdraw actions"
        );
        require(_args.owner != address(0), "Actions: cannot withdraw to an invalid account");

        return
            WithdrawArgs({
                owner: _args.owner,
                vaultId: _args.vaultId,
                to: _args.sender,
                asset: _args.asset,
                index: _args.index,
                amount: _args.amount
            });
    }
}
