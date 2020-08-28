// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {OracleInterface} from "../interfaces/OracleInterface.sol";

contract MockPricer {
    OracleInterface public oracle;

    mapping(address => uint256) internal price;

    constructor(address _oracle) public {
        oracle = OracleInterface(_oracle);
    }

    function setPrice(address _asset, uint256 _price) external {
        price[_asset] = _price;
    }

    function getPrice(address _asset) external view returns (uint256) {
        return price[_asset];
    }

    function setExpiryPriceToOralce(
        address _asset,
        uint256 _expiryTimestamp,
        uint256 _price
    ) external {
        oracle.setExpiryPrice(_asset, _expiryTimestamp, _price);
    }
}
