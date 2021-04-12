// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {Actions} from "../libs/Actions.sol";

contract ActionTester {
    Actions.OpenVaultArgs private openVaultArgs;
    Actions.DepositArgs private depositArgs;
    Actions.WithdrawArgs private withdrawArgs;
    Actions.MintArgs private mintArgs;
    Actions.BurnArgs private burnArgs;
    Actions.RedeemArgs private redeemArgs;
    Actions.SettleVaultArgs private settleVaultArgs;
    Actions.CallArgs private callArgs;
    Actions.LiquidateArgs private liquidateArgs;

    function testParseDespositAction(Actions.ActionArgs memory _args) external {
        depositArgs = Actions._parseDepositArgs(_args);
    }

    function getDepositArgs() external view returns (Actions.DepositArgs memory) {
        return depositArgs;
    }

    function testParseWithdrawAction(Actions.ActionArgs memory _args) external {
        withdrawArgs = Actions._parseWithdrawArgs(_args);
    }

    function getWithdrawArgs() external view returns (Actions.WithdrawArgs memory) {
        return withdrawArgs;
    }

    function testParseOpenVaultAction(Actions.ActionArgs memory _args) external {
        openVaultArgs = Actions._parseOpenVaultArgs(_args);
    }

    function getOpenVaultArgs() external view returns (Actions.OpenVaultArgs memory) {
        return openVaultArgs;
    }

    function testParseRedeemAction(Actions.ActionArgs memory _args) external {
        redeemArgs = Actions._parseRedeemArgs(_args);
    }

    function getRedeemArgs() external view returns (Actions.RedeemArgs memory) {
        return redeemArgs;
    }

    function testParseSettleVaultAction(Actions.ActionArgs memory _args) external {
        settleVaultArgs = Actions._parseSettleVaultArgs(_args);
    }

    function testParseLiquidateActions(Actions.ActionArgs memory _args) external {
        liquidateArgs = Actions._parseLiquidateArgs(_args);
    }

    function getSettleVaultArgs() external view returns (Actions.SettleVaultArgs memory) {
        return settleVaultArgs;
    }

    function testParseMintAction(Actions.ActionArgs memory _args) external {
        mintArgs = Actions._parseMintArgs(_args);
    }

    function getMintArgs() external view returns (Actions.MintArgs memory) {
        return mintArgs;
    }

    function testParseBurnAction(Actions.ActionArgs memory _args) external {
        burnArgs = Actions._parseBurnArgs(_args);
    }

    function getBurnArgs() external view returns (Actions.BurnArgs memory) {
        return burnArgs;
    }

    function testParseCallAction(Actions.ActionArgs memory _args) external {
        callArgs = Actions._parseCallArgs(_args);
    }

    function getCallArgs() external view returns (Actions.CallArgs memory) {
        return callArgs;
    }

    function getLiquidateArgs() external view returns (Actions.LiquidateArgs memory) {
        return liquidateArgs;
    }
}
