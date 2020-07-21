/* SPDX-License-Identifier: UNLICENSED */
pragma solidity =0.6.10;

import {ERC20Initializable} from "./packages/oz/upgradeability/ERC20Initializable.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";
import {AddressBookInterface} from "./interfaces/AddressBookInterface.sol";

/**
 * @title Otoken
 * @author Opyn
 * @notice Otoken is the ERC20 token for an option.
 * @dev The Otoken inherits ERC20Initializable because we need to use the init instead of constructor.
 */
contract Otoken is ERC20Initializable {
    using SafeMath for uint256;
    address public addressBook;
    address public underlyingAsset;
    address public strikeAsset;
    address public collateralAsset;

    uint256 public strikePrice;
    uint256 public expiry;

    bool public isPut;

    constructor(address _addressBook) public {
        addressBook = _addressBook;
    }

    /**
     * @notice initialize a new otokens.
     * @param _underlyingAsset asset that the option references
     * @param _strikeAsset asset that the strike price is denominated in
     * @param _collateralAsset asset that is held as collateral against short/written options
     * @param _strikePrice strike price with decimals = 18
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option, if not it is a call
     */
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
        (string memory name, string memory symbol) = _getNameAndSymbol(
            _underlyingAsset,
            _strikeAsset,
            _collateralAsset,
            _strikePrice,
            _expiry,
            _isPut
        );
        __ERC20_init_unchained(name, symbol);
    }

    /**
     * @notice return option name as ETHUSDC/1597512453/200P/USDC, symbol ETHUSDC/1597512453/200P/USDC
     * @return name ETH-USDC 200 Put 1597512453
     * @return symbol ETHUSDC/1597512453/200P/USDC
     */
    function _getNameAndSymbol(
        address _underlyingAsset,
        address _strikeAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) internal view returns (string memory name, string memory symbol) {
        string memory underlying = _getTokenSymbol(_underlyingAsset);
        string memory strike = _getTokenSymbol(_strikeAsset);
        string memory collateral = _getTokenSymbol(_collateralAsset);
        uint256 displayedStrikePrice = _strikePrice.div(1000000000000000000);
        string memory optionType;
        string memory optionTypeChar;
        if (_isPut) {
            optionType = "Put";
            optionTypeChar = "P";
        } else {
            optionType = "Call";
            optionTypeChar = "C";
        }

        name = string(
            abi.encodePacked(
                underlying,
                strike,
                " $",
                uint2str(displayedStrikePrice),
                optionType,
                " ",
                uint2str(_expiry)
            )
        );

        symbol = string(
            abi.encodePacked(
                underlying,
                strike,
                "/",
                uint2str(_expiry),
                "/",
                uint2str(displayedStrikePrice),
                optionTypeChar,
                "/",
                collateral
            )
        );
    }

    /**
     * @dev get token symbol
     * @param token the ERC20 token address
     */
    function _getTokenSymbol(address token) internal view returns (string memory) {
        if (token == address(0)) return "ETH";
        else return ERC20Initializable(token).symbol();
    }

    /**
     * @dev convert uint256 to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len.sub(1);
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + (_i % 10)));
            _i /= 10;
        }
        return string(bstr);
    }
}
