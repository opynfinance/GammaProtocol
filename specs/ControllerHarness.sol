/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import {Controller} from '../contracts/Controller.sol';

/**
 * @title Controller Harness
 * @author Opyn Team
 * @notice Contract that controls the Gamma Protocol and the interaction of all sub contracts
 */
contract ControllerHarness is Controller {
  function testOperate(
    uint256[] memory _actionType,
    address[] memory _owner,
    address[] memory _secondAddress,
    address[] memory _asset,
    uint256[] memory _vaultId,
    uint256[] memory _amount
  ) public {
    Actions.ActionArgs[] memory _actions = [];
    for (uint256 i = 0; i < actionType.length; i++) {
      Actions.ActionArgs memory action = Actions.ActionArgs({
        actionType: _actionType[i],
        owner: _owner[i],
        secondAddress: _secondAddress[i],
        asset: _asset[i],
        vaultId: _vaultId[i],
        amount: _amount[i]
      });
      _actions.push(action);
    }

    operate(_actions);
  }
}
