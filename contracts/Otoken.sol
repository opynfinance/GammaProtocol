/* SPDX-License-Identifier: UNLICENSED */
pragma solidity =0.6.10;

import {ERC20Initializable} from "./packages/oz/upgradeability/ERC20Initializable.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";
import {Strings} from "./packages/oz/Strings.sol";
import {BokkyPooBahsDateTimeLibrary} from "./packages/BokkyPooBahsDateTimeLibrary.sol";
import {AddressBookInterface} from "./interfaces/AddressBookInterface.sol";

/**
 * @title Otoken
 * @author Opyn Team
 * @notice Otoken is the ERC20 token for an option
 * @dev The Otoken inherits ERC20Initializable because we need to use the init instead of constructor
 */
contract Otoken is ERC20Initializable {
    using SafeMath for uint256;

    /// @notice address of the AddressBook module
    address public addressBook;

    /// @notice asset that the option references
    address public underlyingAsset;

    /// @notice asset that the strike price is denominated in
    address public strikeAsset;

    /// @notice asset that is held as collateral against short/written options
    address public collateralAsset;

    /// @notice strike price with decimals = 18
    uint256 public strikePrice;

    /// @notice expiration timestamp of the option, represented as a unix timestamp
    uint256 public expiryTimestamp;

    /// @notice True if a put option, False if a call option
    bool public isPut;

    uint256 private constant STRIKE_PRICE_DIGITS = 1e18;

    /**
     * @notice initialize the oToken
     * @param _underlyingAsset asset that the option references
     * @param _strikeAsset asset that the strike price is denominated in
     * @param _collateralAsset asset that is held as collateral against short/written options
     * @param _strikePrice strike price with decimals = 18
     * @param _expiryTimestamp expiration timestamp of the option, represented as a unix timestamp
     * @param _isPut True if a put option, False if a call option
     */
    function init(
        address _addressBook,
        address _underlyingAsset,
        address _strikeAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiryTimestamp,
        bool _isPut
    ) external initializer {
        addressBook = _addressBook;
        underlyingAsset = _underlyingAsset;
        strikeAsset = _strikeAsset;
        collateralAsset = _collateralAsset;
        strikePrice = _strikePrice;
        expiryTimestamp = _expiryTimestamp;
        isPut = _isPut;
        (string memory tokenName, string memory tokenSymbol) = _getNameAndSymbol();
        __ERC20_init_unchained(tokenName, tokenSymbol);
    }

    /**
     * @notice mint oToken for an account
     * @dev Controller only method where access control is taken care of by _beforeTokenTransfer hook
     * @param account account to mint token to
     * @param amount amount to mint
     */
    function mintOtoken(address account, uint256 amount) external {
        _mint(account, amount);
    }

    /**
     * @notice burn oToken from an account.
     * @dev Controller only method where access control is taken care of by _beforeTokenTransfer hook
     * @param account account to burn token from
     * @param amount amount to burn
     */
    function burnOtoken(address account, uint256 amount) external {
        _burn(account, amount);
    }

    /**
     * @notice generates the name and symbol for an option
     * @dev this function uses a named return variable to avoid the stack-too-deep error
     * @return tokenName (ex: ETHUSDC 05-September-2020 200 Put USDC Collateral)
     * @return tokenSymbol (ex: oETHUSDC-05SEP20-200P)
     */
    function _getNameAndSymbol() internal view returns (string memory tokenName, string memory tokenSymbol) {
        string memory underlying = _getTokenSymbol(underlyingAsset);
        string memory strike = _getTokenSymbol(strikeAsset);
        string memory collateral = _getTokenSymbol(collateralAsset);
        uint256 displayedStrikePrice = strikePrice.div(STRIKE_PRICE_DIGITS);

        // convert expiry to a readable string
        (uint256 year, uint256 month, uint256 day) = BokkyPooBahsDateTimeLibrary.timestampToDate(expiryTimestamp);

        // get option type string
        (string memory typeSymbol, string memory typeFull) = _getOptionType(isPut);

        //get option month string
        (string memory monthSymbol, string memory monthFull) = _getMonth(month);

        // concatenated name string: ETHUSDC 05-September-2020 200 Put USDC Collateral
        tokenName = string(
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

        // concatenated symbol string: oETHUSDC-05SEP20-200P
        tokenSymbol = string(
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
     * @dev return a representation of a number using 2 characters, adds a leading 0 if one digit, uses two trailing digits if a 3 digit number
     * @return 2 characters that corresponds to a number
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
     * @dev return string representation of option type
     * @return shortString a 1 character representation of option type (P or C)
     * @return longString a full length string of option type (Put or Call)
     */
    function _getOptionType(bool _isPut) internal pure returns (string memory shortString, string memory longString) {
        if (_isPut) {
            return ("P", "Put");
        } else {
            return ("C", "Call");
        }
    }

    /**
     * @dev return string representation of a month
     * @return shortString a 3 character representation of a month (ex: SEP, DEC, etc)
     * @return longString a full length string of a month (ex: September, December, etc)
     */
    function _getMonth(uint256 _month) internal pure returns (string memory shortString, string memory longString) {
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
     * @dev this function overrides the _beforeTokenTransfer hook in ERC20Initializable.sol
     * if the operation is mint or burn, requires msg.sender to be the controller
     * the function signature is the same as _beforeTokenTransfer defined in ERC20Initializable.sol
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
                "Otoken: Only Controller can mint Otokens"
            );
        } else if (to == address(0)) {
            require(
                msg.sender == AddressBookInterface(addressBook).getController(),
                "Otoken: Only Controller can burn Otokens"
            );
        }
    }
}
