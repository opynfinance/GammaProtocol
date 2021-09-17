// SPDX-License-Identifier: MIT

import {ERC20Interface} from "./ERC20Interface.sol";

pragma solidity 0.6.10;
pragma experimental ABIEncoderV2;

interface IStakeDao {
    function getPricePerFullShare() external view returns (uint256);
}
