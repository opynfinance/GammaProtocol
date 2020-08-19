/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 *
 */
// solhint-disable-next-line no-empty-blocks
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
}
