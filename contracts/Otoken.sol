pragma solidity =0.6.10;

import {ERC20UpgradeSafe} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";

/**
 * @dev The Otoken inherits ERC20UpgradeSafe because we need to use the init instead of constructor.
 */
contract Otoken is ERC20UpgradeSafe {
    address public strikeAsset;
    address public underlyingAsset;
    address public collateralAsset;

    uint256 public strikePrice;
    uint256 public expiry;

    bool public isPut;

    string private _name;
    string private _symbol;
    string private _decimals;

    function init(
        address _strikeAsset,
        address _underlyingAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut,
        string memory _tokenName,
        string memory _tokenSymbol
    ) external initializer {
        strikeAsset = _strikeAsset;
        underlyingAsset = _underlyingAsset;
        collateralAsset = _collateralAsset;
        strikePrice = _strikePrice;
        expiry = _expiry;
        isPut = _isPut;
        __ERC20_init_unchained(_tokenName, _tokenSymbol);
    }
}
