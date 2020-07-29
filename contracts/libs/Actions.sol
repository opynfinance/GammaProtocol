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

    struct OpenVaultArgs {
        /// @notice The address of the account owner
        address owner;
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

    struct ExerciseArgs {
        /// @notice The address from which we transfer the otokens, to which we pay out the cash difference if the option is ITM.
        address exerciser;
        /// @notice The otoken that is to be exercised
        address otoken;
        /// @notice The amount of otokens that is to be exercised
        uint256 amount;
    }

    struct SettleVaultArgs {
        /// @notice The address of the account owner
        address owner;
        /// @notice The index of the vault to which is to be settled
        uint256 vaultId;
        /// @notice The address to which we transfer the remaining collateral
        address to;
    }

    /**
     * @notice Parses the passed in action argmuents to get the argmuents for an open vault action
     * @param _args The general action arguments structure
     * @return The arguments for a open vault action
     */
    function _parseOpenVaultArgs(ActionArgs memory _args) internal returns (OpenVaultArgs memory) {
        require(_args.actionType == ActionType.OpenVault, "Actions: can only parse arguments for open vault actions");
        require(_args.owner != address(0), "Actions: cannot open vault for an invalid account");

        return OpenVaultArgs({owner: _args.owner});
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
     * @notice Parses the passed in action argmuents to get the argmuents for an exercise action
     * @param _args The general action arguments structure
     * @return The arguments for a exercise action
     */
    function _parseExerciseArgs(ActionArgs memory _args) internal returns (ExerciseArgs memory) {
        require(_args.actionType == ActionType.Exercise, "Actions: can only parse arguments for exercise actions");

        return ExerciseArgs({exerciser: _args.sender, otoken: _args.asset, amount: _args.amount});
    }

    /**
     * @notice Parses the passed in action argmuents to get the argmuents for a settle vault action
     * @param _args The general action arguments structure
     * @return The arguments for a settle vault action
     */
    function _parseSettleVaultArgs(ActionArgs memory _args) internal returns (SettleVaultArgs memory) {
        require(
            _args.actionType == ActionType.SettleVault,
            "Actions: can only parse arguments for settle vault actions"
        );
        require(_args.owner != address(0), "Actions: cannot settle vault for an invalid account");

        return SettleVaultArgs({owner: _args.owner, vaultId: _args.vaultId, to: _args.sender});
    }
}
