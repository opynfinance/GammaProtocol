// SPDX-License-Identifier: UNLICENSED
pragma experimental ABIEncoderV2;

import {Actions} from "../libs/Actions.sol";

contract ActionTester {
    Actions.DepositArgs private depositArgs;

    function testParseDespositAction(Actions.ActionArgs memory _args) external {
        depositArgs = Actions._parseDepositArgs(_args);
    }

    function getDepositArgs() external view returns (Actions.DepositArgs memory) {
        return depositArgs;
    }
}
