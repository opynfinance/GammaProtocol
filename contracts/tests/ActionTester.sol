// SPDX-License-Identifier: UNLICENSED
pragma experimental ABIEncoderV2;

import {Actions} from "../libs/Actions.sol";

contract ActionTester {
    Actions.DepositArgs private depositArgs;
    Actions.MintArgs private mintArgs;
    Actions.BurnArgs private burnArgs;

    function testParseDepositAction(Actions.ActionArgs memory _args) external {
        depositArgs = Actions._parseDepositArgs(_args);
    }

    function getDepositArgs() external view returns (Actions.DepositArgs memory) {
        return depositArgs;
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
}
