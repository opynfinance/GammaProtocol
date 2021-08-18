// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;
pragma experimental ABIEncoderV2;

interface ICurve {
    function add_liquidity(uint256[2] memory amounts, uint256 minAmount) external payable returns (uint256);

    function remove_liquidity_one_coin(
        uint256 _token_amount,
        int128 i,
        uint256 _minAmount
    ) external returns (uint256);

    function get_virtual_price() external view returns (uint256);
}
