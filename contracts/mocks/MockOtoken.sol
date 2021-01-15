pragma solidity =0.6.10;

import {ERC20Upgradeable} from "../packages/oz/upgradeability/ERC20Upgradeable.sol";
import {AddressBookInterface} from "../interfaces/AddressBookInterface.sol";

/**
 * SPDX-License-Identifier: UNLICENSED
 * @dev The Otoken inherits ERC20Upgradeable because we need to use the init instead of constructor.
 */
contract MockOtoken is ERC20Upgradeable {
    address public controller;
    address public underlyingAsset;
    address public strikeAsset;
    address public collateralAsset;

    uint256 public strikePrice;
    uint256 public expiryTimestamp;

    bool public isPut;

    bool public inited = false;

    function init(
        address _addressBook,
        address _underlyingAsset,
        address _strikeAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiryTimestamp,
        bool _isPut
    ) external {
        inited = true;
        controller = AddressBookInterface(_addressBook).getController();
        underlyingAsset = _underlyingAsset;
        strikeAsset = _strikeAsset;
        collateralAsset = _collateralAsset;
        strikePrice = _strikePrice;
        expiryTimestamp = _expiryTimestamp;
        isPut = _isPut;
        string memory tokenName = "ETHUSDC/1597511955/200P/USDC";
        string memory tokenSymbol = "oETHUSDCP";
        __ERC20_init_unchained(tokenName, tokenSymbol);
        _setupDecimals(8);
    }

    function mintOtoken(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }

    function burnOtoken(address account, uint256 amount) external {
        _burn(account, amount);
    }
}
