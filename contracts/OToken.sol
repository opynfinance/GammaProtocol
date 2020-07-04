pragma solidity =0.6.0;

contract Otoken {
    address public strikeAsset;
    address public underlyingAsset;
    address public collateralAsset;

    uint256 public strikePrice;
    uint256 public expiry;

    string public name;
    string public symbol;
    uint256 public decimals;

    bool public isPut;

    function init(
        address _strikeAsset,
        address _underlyingAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) external {
        strikeAsset = _strikeAsset;
        underlyingAsset = _underlyingAsset;
        collateralAsset = _collateralAsset;
        strikePrice = _strikePrice;
        expiry = _expiry;
        isPut = _isPut;
    }
}
