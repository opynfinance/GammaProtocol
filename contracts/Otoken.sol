/* SPDX-License-Identifier: UNLICENSED */
pragma solidity =0.6.10;

import {ERC20Initializable} from "./packages/oz/upgradeability/ERC20Initializable.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";
import {BokkyPooBahsDateTimeLibrary} from "./packages/BokkyPooBahsDateTimeLibrary.sol";
import {AddressBookInterface} from "./interfaces/AddressBookInterface.sol";

/**
 * @title Otoken
 * @author Opyn
 * @notice Otoken is the ERC20 token for an option.
 * @dev The Otoken inherits ERC20Initializable because we need to use the init instead of constructor.
 */
contract Otoken is ERC20Initializable {
    using SafeMath for uint256;

    /// @notice address of the addressBook module
    address public addressBook;

    /// @notice asset that the option references
    address public underlyingAsset;

    /// @notice asset that the strike price is denominated in
    address public strikeAsset;

    /// @notice asset that is held as collateral against short/written options
    address public collateralAsset;

    /// @notice strike price with decimals = 18
    uint256 public strikePrice;

    /// @notice time of the option represented by unix timestamp
    uint256 public expiry;

    /// @notice is this a put option, if not it is a call
    bool public isPut;

    uint256 private constant STRIKE_PRICE_DIGITS = 1e18;

    constructor(address _addressBook) public {
        addressBook = _addressBook;
    }

    /**
     * @notice initialize the otoken.
     * @param _underlyingAsset asset that the option references
     * @param _strikeAsset asset that the strike price is denominated in
     * @param _collateralAsset asset that is held as collateral against short/written options
     * @param _strikePrice strike price with decimals = 18
     * @param _expiry time of the option represented by unix timestamp
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
     * @notice generate name and symbol for an option
     * @return name ETHUSDC/20200930/200P/USDC
     * @return symbol $200 ETHP 20200930
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
        uint256 displayedStrikePrice = _strikePrice.div(STRIKE_PRICE_DIGITS);
        // convert expiry to readable string
        (uint256 year, uint256 month, uint256 day) = BokkyPooBahsDateTimeLibrary.timestampToDate(_expiry);

        // Get option type string
        string memory optionType;
        if (_isPut) {
            optionType = "P";
        } else {
            optionType = "C";
        }

        // concat name string: ETHUSDC/20200930/200P/USDC
        name = string(
            abi.encodePacked(
                underlying,
                strike,
                "/",
                uint2str(year),
                padZero(uint2str(month)),
                padZero(uint2str(day)),
                "/",
                uint2str(displayedStrikePrice),
                optionType,
                "/",
                collateral
            )
        );

        // concat symbol string: $200 ETHP 20200930
        symbol = string(
            abi.encodePacked(
                "$",
                uint2str(displayedStrikePrice),
                " ",
                underlying,
                optionType,
                " ",
                uint2str(year),
                padZero(uint2str(month)),
                padZero(uint2str(day))
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
     * @param _i number to be converted to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
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

    /**
     * @dev Pad 0 at the start of the string if len < 2
     * @param str string to be padded
     * @return string with len >= 2
     */
    function padZero(string memory str) internal pure returns (string memory) {
        bytes memory bstr = bytes(str);
        if (bstr.length < 2) {
            return string(abi.encodePacked("0", str));
        }
        return str;
    }
}
