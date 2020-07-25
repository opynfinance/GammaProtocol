/* SPDX-License-Identifier: UNLICENSED */
pragma solidity =0.6.10;

import {ERC20Initializable} from "./packages/oz/upgradeability/ERC20Initializable.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";
import {Strings} from "./packages/oz/Strings.sol";
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
        (string memory name, string memory symbol) = _getNameAndSymbol();
        __ERC20_init_unchained(name, symbol);
    }

    /**
     * @notice Mint oToken for an account.
     * @dev this is a Controller only method. Access control is taken care of by _beforeTokenTransfer hook.
     * @param account the account to mint token to
     * @param amount the amount to mint
     */
    function mintOtoken(address account, uint256 amount) external {
        _mint(account, amount);
    }

    /**
     * @notice Burn oToken from an account.
     * @dev this is a Controller only method. Access control is taken care of by _beforeTokenTransfer hook.
     * @param account the account to burn token from
     * @param amount the amount to burn
     */
    function burnOtoken(address account, uint256 amount) external {
        _burn(account, amount);
    }

    /**
     * @notice generate name and symbol for an option
     * @return name ETHUSDC 05-September-2020 200 Put USDC Collateral
     * @return symbol oETHUSDC-05SEP20-200P
     */
    function _getNameAndSymbol() internal view returns (string memory name, string memory symbol) {
        string memory underlying = _getTokenSymbol(underlyingAsset);
        string memory strike = _getTokenSymbol(strikeAsset);
        string memory collateral = _getTokenSymbol(collateralAsset);
        uint256 displayedStrikePrice = strikePrice.div(STRIKE_PRICE_DIGITS);
        // convert expiry to readable string
        (uint256 year, uint256 month, uint256 day) = BokkyPooBahsDateTimeLibrary.timestampToDate(expiry);

        // Get option type string
        (string memory typeSymbol, string memory typeFull) = _getOptionType(isPut);

        (string memory monthSymbol, string memory monthFull) = _getMonth(month);

        // concat name string: ETHUSDC 05-September-2020 200 Put USDC Collateral
        name = string(
            abi.encodePacked(
                underlying,
                strike,
                " ",
                _uintTo2Chars(day),
                "-",
                monthFull,
                "-",
                Strings.toString(year),
                " ",
                Strings.toString(displayedStrikePrice),
                typeFull,
                " ",
                collateral,
                " Collateral"
            )
        );

        // concat symbol string: oETHUSDC-05SEP20-200P
        symbol = string(
            abi.encodePacked(
                "o",
                underlying,
                strike,
                "-",
                _uintTo2Chars(day),
                monthSymbol,
                _uintTo2Chars(year),
                "-",
                Strings.toString(displayedStrikePrice),
                typeSymbol
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
     * @dev Internal function to get the number with 2 characters.
     * @return The 2 characters for the number.
     */
    function _uintTo2Chars(uint256 number) internal pure returns (string memory) {
        string memory str = Strings.toString(number);
        if (number > 99) return Strings.toString(number % 100);
        if (number < 10) {
            return string(abi.encodePacked("0", str));
        } else {
            return str;
        }
    }

    /**
     * @dev return string of option type
     * @return symbol P or C
     * @return full Put or Call
     */
    function _getOptionType(bool _isPut) internal pure returns (string memory symbol, string memory full) {
        if (_isPut) {
            return ("P", "Put");
        } else {
            return ("C", "Call");
        }
    }

    /**
     * @dev return string of month.
     * @return symbol SEP, DEC ...etc
     * @return full September, December ...etc
     */
    function _getMonth(uint256 _month) internal pure returns (string memory symbol, string memory full) {
        if (_month == 1) {
            return ("JAN", "January");
        } else if (_month == 2) {
            return ("FEB", "February");
        } else if (_month == 3) {
            return ("MAR", "March");
        } else if (_month == 4) {
            return ("APR", "April");
        } else if (_month == 5) {
            return ("MAY", "May");
        } else if (_month == 6) {
            return ("JUN", "June");
        } else if (_month == 7) {
            return ("JUL", "July");
        } else if (_month == 8) {
            return ("AUG", "August");
        } else if (_month == 9) {
            return ("SEP", "September");
        } else if (_month == 10) {
            return ("OCT", "October");
        } else if (_month == 11) {
            return ("NOV", "November");
        } else {
            return ("DEC", "December");
        }
    }

    /**
     * @dev this function overrides the _beforeTokenTransfer hook in ERC20Initializable.sol.
     * If the operation is mint or burn, requires msg.sender to be the controller.
     * The function signature is the same as _beforeTokenTransfer defined in ERC20Initializable.sol.
     * @param from from address
     * @param to to address
     * @param amount amount to transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (from == address(0)) {
            require(
                msg.sender == AddressBookInterface(addressBook).getController(),
                "Otoken: Only Controller can mint Otokens."
            );
        } else if (to == address(0)) {
            require(
                msg.sender == AddressBookInterface(addressBook).getController(),
                "Otoken: Only Controller can burn Otokens."
            );
        }
    }
}
