// SPDX-License-Identifier: UNLICENSED
/* solhint-disable */
pragma solidity =0.6.0;
pragma experimental ABIEncoderV2;

library Actions {
    // ============ Enums ============

    enum ActionType {AddCollateral, RemoveCollateral, AddLong, RemoveLong, MintShort, BurnShort}

    // ============ Structs ============

    /*
     * Arguments that are passed to Solo in an ordered list as part of a single operation.
     * Each ActionArgs has an actionType which specifies which action struct that this data will be
     * parsed into before being processed.
     */
    struct ActionArgs {
        ActionType actionType;
        uint256 amount;
        address asset;
    }

    // ============ Action Types ============

    struct AddCollateralArgs {
        uint256 amount;
        address asset;
    }

    struct RemoveCollateralArgs {
        uint256 amount;
        address asset;
    }

    struct AddLongArgs {
        uint256 amount;
        address asset;
    }

    struct RemoveLongArgs {
        uint256 amount;
        address asset;
    }

    struct MintShortArgs {
        uint256 amount;
        address asset;
    }

    struct BurnShortArgs {
        uint256 amount;
        address asset;
    }

    // ============= Parsing Functions =============

    function parseAddCollateral(ActionArgs memory args) internal pure returns (AddCollateralArgs memory) {
        assert(args.actionType == ActionType.AddCollateral);
        return AddCollateralArgs({asset: args.asset, amount: args.amount});
    }

    function parseRemoveCollateral(ActionArgs memory args) internal pure returns (RemoveCollateralArgs memory) {
        assert(args.actionType == ActionType.RemoveCollateral);
        return RemoveCollateralArgs({asset: args.asset, amount: args.amount});
    }

    function parseAddLong(ActionArgs memory args) internal pure returns (AddLongArgs memory) {
        assert(args.actionType == ActionType.AddLong);
        return AddLongArgs({asset: args.asset, amount: args.amount});
    }

    function parseRemoveLong(ActionArgs memory args) internal pure returns (RemoveLongArgs memory) {
        assert(args.actionType == ActionType.RemoveLong);
        return RemoveLongArgs({asset: args.asset, amount: args.amount});
    }

    function parseMintShort(ActionArgs memory args) internal pure returns (MintShortArgs memory) {
        assert(args.actionType == ActionType.MintShort);
        return MintShortArgs({asset: args.asset, amount: args.amount});
    }

    function parseBurnShort(ActionArgs memory args) internal pure returns (BurnShortArgs memory) {
        assert(args.actionType == ActionType.BurnShort);
        return BurnShortArgs({asset: args.asset, amount: args.amount});
    }
}
