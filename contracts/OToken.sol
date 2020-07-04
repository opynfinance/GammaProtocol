pragma solidity =0.6.0;

contract OToken {
    address public strikeAsset;
    address public underlyingAsset;
    uint256 public strikePrice;

    function init(
        address _strikeAsset,
        address _underlyingAsset,
        uint256 _strikePrice
    ) external {
        strikeAsset = _strikeAsset;
        underlyingAsset = _underlyingAsset;
        strikePrice = _strikePrice;
    }
}
