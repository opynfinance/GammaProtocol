// SPDX-License-Identifier: UNLICENSED
pragma experimental ABIEncoderV2;

import {Actions} from "../libs/Actions.sol";

contract ActionTester {
    Actions.DepositArgs private depositArgs;
    Actions.SettleVaultArgs private settleVaultArgs;

    function testParseDespositAction(Actions.ActionArgs memory _args) external {
        depositArgs = Actions._parseDepositArgs(_args);
    }

    function getDepositArgs() external view returns (Actions.DepositArgs memory) {
        return depositArgs;
    }

    function testParseSettleVaultAction(Actions.ActionArgs memory _args) external {
        settleVaultArgs = Actions._parseSettleVaultArgs(_args);
    }

    function getSettleVaultArgs() external view returns (Actions.SettleVaultArgs memory) {
        return settleVaultArgs;
    }
}
