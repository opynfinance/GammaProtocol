// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

contract MockOracle {
    mapping(address => mapping(uint256 => uint256)) public price;

    // let the pricer set expiry price to oracle.
    function setExpiryPrice(
        address _asset,
        uint256 _expiryTimestamp,
        uint256 _price
    ) external {
        price[_asset][_expiryTimestamp] = _price;
    }

    function getExpiryPrice(address _asset, uint256 _expiryTimestamp) external view returns (uint256) {
        return price[_asset][_expiryTimestamp];
    }
}
