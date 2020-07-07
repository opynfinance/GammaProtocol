pragma solidity =0.6.0;

import {Initializable} from "./lib/Initializable.sol";

contract Otoken is Initializable {
    address public strikeAsset;
    address public underlyingAsset;
    address public collateralAsset;

    uint256 public strikePrice;
    uint256 public expiry;

    bool public isPut;

    function init(
        address _strikeAsset,
        address _underlyingAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) external initializer {
        strikeAsset = _strikeAsset;
        underlyingAsset = _underlyingAsset;
        collateralAsset = _collateralAsset;
        strikePrice = _strikePrice;
        expiry = _expiry;
        isPut = _isPut;
    }
}
