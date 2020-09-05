/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 *
 */
library Actions {
    // Possible actions that can be performed
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
        // The type of action that is being performed on the system
        ActionType actionType;
        // The address of the account owner
        address owner;
        // The address which we move assets from or to (depending on the action type)
        address sender;
        // The asset that is to be transfered
        address asset;
        // The index of the vault that is to be modified (if any)
        uint256 vaultId;
        // The amount of asset that is to be transfered
        uint256 amount;
        // Each vault can hold multiple short / long / collateral assets. In this version, we are restricting the scope to only 1 of each.
        // In future versions this would be the index of the short / long / collateral asset that needs to be modified.
        uint256 index;
        // Any other data that needs to be passed in for arbitrary function calls
        bytes data;
    }

    struct MintArgs {
        // The address of the account owner
        address owner;
        // The index of the vault from which the asset will be minted
        uint256 vaultId;
        // The address to which we transfer the minted otokens
        address to;
        // The otoken that is to be minted
        address otoken;
        // Each vault can hold multiple short / long / collateral assets. In this version, we are restricting the scope to only 1 of each.
        // In future versions this would be the index of the short / long / collateral asset that needs to be modified.
        uint256 index;
        // The amount of otokens that is to be minted
        uint256 amount;
    }

    struct BurnArgs {
        // The address of the account owner
        address owner;
        // The index of the vault from which the otoken will be burned
        uint256 vaultId;
        // The address from which we transfer the otokens
        address from;
        // The otoken that is to be burned
        address otoken;
        // Each vault can hold multiple short / long / collateral assets. In this version, we are restricting the scope to only 1 of each.
        // In future versions this would be the index of the short / long / collateral asset that needs to be modified.
        uint256 index;
        // The amount of otokens that is to be burned
        uint256 amount;
    }

    struct OpenVaultArgs {
        // address of the account that the vault belong to
        address owner;
        // vault id
        uint256 vaultId;
    }

    struct DepositArgs {
        // The address of the account owner
        address owner;
        // The index of the vault to which the asset will be added
        uint256 vaultId;
        // The address from which we transfer the asset
        address from;
        // The asset that is to be deposited
        address asset;
        // Each vault can hold multiple short / long / collateral assets. In this version, we are restricting the scope to only 1 of each.
        // In future versions this would be the index of the short / long / collateral asset that needs to be modified.
        uint256 index;
        // The amount of asset that is to be transfered
        uint256 amount;
    }

    struct ExerciseArgs {
        // The address from which we transfer the otokens, to which we pay out the cash difference if the option is ITM.
        address exerciser;
        // The otoken that is to be exercised
        address otoken;
        // The amount of otokens that is to be exercised
        uint256 amount;
    }

    struct WithdrawArgs {
        //The address of the account owner
        address owner;
        // The index of the vault from which the asset will be withdrawn
        uint256 vaultId;
        // The address to which we transfer the asset
        address to;
        // The asset that is to be withdrawn
        address asset;
        // Each vault can hold multiple short / long / collateral assets.
        // In this version, we are restricting the scope to only 1 of each.
        // In future versions this would be the index of the short / long / collateral asset that needs to be modified.
        uint256 index;
        // The amount of asset that is to be transfered
        uint256 amount;
    }

    struct SettleVaultArgs {
        // The address of the account owner
        address owner;
        // The index of the vault to which is to be settled
        uint256 vaultId;
        // The address to which we transfer the remaining collateral
        address to;
    }

    struct CallArgs {
        // The address of the account owner
        address owner;
        // The address of the callee contract
        address callee;
        // The data field for external calls
        bytes data;
    }

    /**
     * @notice Parses the passed in action argmuents to get the argmuents for an open vault action
     * @param _args The general action arguments structure
     * @return The arguments for a open vault action
     */
    function _parseOpenVaultArgs(ActionArgs memory _args) internal pure returns (OpenVaultArgs memory) {
        require(_args.actionType == ActionType.OpenVault, "Actions: can only parse arguments for open vault actions");
        require(_args.owner != address(0), "Actions: cannot open vault for an invalid account");

        return OpenVaultArgs({owner: _args.owner, vaultId: _args.vaultId});
    }

    /**
     * @notice Parses the passed in action argmuents to get the argmuents for a mint action
     * @param _args The general action arguments structure
     * @return The arguments for a mint action
     */
    function _parseMintArgs(ActionArgs memory _args) internal pure returns (MintArgs memory) {
        require(_args.actionType == ActionType.MintShortOption, "Actions: can only parse arguments for mint actions");
        require(_args.owner != address(0), "Actions: cannot mint from an invalid account");

        return
            MintArgs({
                owner: _args.owner,
                vaultId: _args.vaultId,
                to: _args.sender,
                otoken: _args.asset,
                index: _args.index,
                amount: _args.amount
            });
    }

    /**
     * @notice Parses the passed in action argmuents to get the argmuents for a burn action
     * @param _args The general action arguments structure
     * @return The arguments for a burn action
     */
    function _parseBurnArgs(ActionArgs memory _args) internal pure returns (BurnArgs memory) {
        require(_args.actionType == ActionType.BurnShortOption, "Actions: can only parse arguments for burn actions");
        require(_args.owner != address(0), "Actions: cannot burn from an invalid account");

        return
            BurnArgs({
                owner: _args.owner,
                vaultId: _args.vaultId,
                from: _args.sender,
                otoken: _args.asset,
                index: _args.index,
                amount: _args.amount
            });
    }

    /**
     * @notice Parses the passed in action argmuents to get the argmuents for a deposit action
     * @param _args The general action arguments structure
     * @return The arguments for a deposit action
     */
    function _parseDepositArgs(ActionArgs memory _args) internal pure returns (DepositArgs memory) {
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
    function _parseWithdrawArgs(ActionArgs memory _args) internal pure returns (WithdrawArgs memory) {
        require(
            (_args.actionType == ActionType.WithdrawLongOption) || (_args.actionType == ActionType.WithdrawCollateral),
            "Actions: can only parse arguments for withdraw actions"
        );
        require(_args.owner != address(0), "Actions: cannot withdraw from an invalid account");
        require(_args.sender != address(0), "Actions: cannot withdraw to an invalid account");

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

    /**
     * @notice Parses the passed in action argmuents to get the argmuents for an exercise action
     * @param _args The general action arguments structure
     * @return The arguments for a exercise action
     */
    function _parseExerciseArgs(ActionArgs memory _args) internal pure returns (ExerciseArgs memory) {
        require(_args.actionType == ActionType.Exercise, "Actions: can only parse arguments for exercise actions");
        require(_args.sender != address(0), "Actions: cannot exercise to an invalid account");

        return ExerciseArgs({exerciser: _args.sender, otoken: _args.asset, amount: _args.amount});
    }

    /**
     * @notice Parses the passed in action argmuents to get the argmuents for a settle vault action
     * @param _args The general action arguments structure
     * @return The arguments for a settle vault action
     */
    function _parseSettleVaultArgs(ActionArgs memory _args) internal pure returns (SettleVaultArgs memory) {
        require(
            _args.actionType == ActionType.SettleVault,
            "Actions: can only parse arguments for settle vault actions"
        );
        require(_args.owner != address(0), "Actions: cannot settle vault for an invalid account");

        return SettleVaultArgs({owner: _args.owner, vaultId: _args.vaultId, to: _args.sender});
    }

    /**
     * @notice Parses the passed in action argmuents to get the argmuents for a call action
     * @param _args The general action arguments structure
     * @return The arguments for a call action
     */
    function _parseCallArgs(ActionArgs memory _args) internal pure returns (CallArgs memory) {
        require(_args.actionType == ActionType.Call, "Actions: can only parse arguments for call actions");
        require(_args.sender != address(0), "Actions: target address cannot be address(0)");

        return CallArgs({owner: _args.owner, callee: _args.sender, data: _args.data});
    }
}
