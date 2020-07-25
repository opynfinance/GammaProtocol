pragma solidity =0.6.10;

import {ERC20Initializable} from "../packages/oz/upgradeability/ERC20Initializable.sol";

/**
 * SPDX-License-Identifier: UNLICENSED
 * @dev The Otoken inherits ERC20Initializable because we need to use the init instead of constructor.
 */
contract MockOtoken is ERC20Initializable {
    address public underlyingAsset;
    address public strikeAsset;
    address public collateralAsset;

    uint256 public strikePrice;
    uint256 public expiry;

    bool public isPut;

    function init(
        address _underlyingAsset,
        address _strikeAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) external initializer {
        underlyingAsset = _underlyingAsset;
        strikeAsset = _strikeAsset;
        collateralAsset = _collateralAsset;
        strikePrice = _strikePrice;
        expiry = _expiry;
        isPut = _isPut;
        string memory name = "ETHUSDC/1597511955/200P/USDC";
        string memory symbol = "oETHUSDCP";
        __ERC20_init_unchained(name, symbol);
    }
}
