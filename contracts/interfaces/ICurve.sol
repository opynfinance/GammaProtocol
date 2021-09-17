// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

interface ICurve {
    function get_virtual_price() external view returns (uint256);
}
