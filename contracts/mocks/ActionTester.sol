// SPDX-License-Identifier: UNLICENSED
pragma experimental ABIEncoderV2;

import {Actions} from "../libs/Actions.sol";

contract ActionTester {
    Actions.DepositArgs private depositArgs;
    Actions.WithdrawArgs private withdrawArgs;

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
}
