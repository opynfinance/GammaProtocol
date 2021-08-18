// SPDX-License-Identifier: MIT

import {ERC20Interface} from "./ERC20Interface.sol";

pragma solidity 0.6.10;
pragma experimental ABIEncoderV2;

interface IStakeDao {
    function depositAll() external;

    function deposit(uint256 amount) external;

    function withdrawAll() external;

    function withdraw(uint256 _shares) external;

    function token() external returns (ERC20Interface);

    function balanceOf(address account) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function getPricePerFullShare() external view returns (uint256);
}
