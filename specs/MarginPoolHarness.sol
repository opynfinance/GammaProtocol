pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import "../contracts/MarginPool.sol";

contract MarginPoolHarness is MarginPool {
    constructor(address _addressBook) public MarginPool(_addressBook) {
    }
/*
    // Override transferToPool and transferToUser and switch case on the available 3 assets
    address public dummyERC20A;
    address public dummyERC20B;
    address public dummyERC20C;

    function transferToPool(
        address _asset,
        address _user,
        uint256 _amount
    ) public override onlyController {
        require(_amount > 0, "MarginPool: transferToPool amount is equal to 0");

        assetBalance[_asset] = assetBalance[_asset].add(_amount);

        // transfer _asset _amount from _user to pool
        if (_asset == dummyERC20A) {
            ERC20Interface(dummyERC20A).safeTransferFrom(_user, address(this), _amount);
        } else if (_asset == dummyERC20B) {
            ERC20Interface(dummyERC20B).safeTransferFrom(_user, address(this), _amount);
        } else if (_asset == dummyERC20C) {
            ERC20Interface(dummyERC20C).safeTransferFrom(_user, address(this), _amount);
        } else {
            require(false);
        }
    }

    function transferToUser(
        address _asset,
        address _user,
        uint256 _amount
    ) public override onlyController {
        assetBalance[_asset] = assetBalance[_asset].sub(_amount);

        // transfer _asset _amount from pool to _user
        if (_asset == dummyERC20A) {
            ERC20Interface(dummyERC20A).safeTransfer(_user, _amount);
        } else if (_asset == dummyERC20B) {
            ERC20Interface(dummyERC20B).safeTransfer(_user, _amount);
        } else if (_asset == dummyERC20C) {
            ERC20Interface(dummyERC20C).safeTransfer(_user, _amount);
        } else {
            require(false);
        }
    }
*/
    mapping(address => uint256) internal assetBalanceHavoc;
    function havocSystemBalance(address _asset) public {
        assetBalance[_asset] = assetBalanceHavoc[_asset];
    }


}
