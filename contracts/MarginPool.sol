/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import {ERC20Interface} from "./interfaces/ERC20Interface.sol";
import {AddressBookInterface} from "./interfaces/AddressBookInterface.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";

/**
 *
 */
contract MarginPool {
    using SafeMath for uint256;

    uint256 public constant BASE_UNIT = 1e18;

    /// @notice AddressBook module
    address public addressBook;

    /**
     * @notice contructor
     * @param _addressBook adressbook module
     */
    constructor(address _addressBook) public {
        require(_addressBook != address(0), "Invalid address book");

        addressBook = _addressBook;
    }

    /**
     * @notice check if the sender is the Controller module
     */
    modifier onlyController() {
        require(
            msg.sender == AddressBookInterface(addressBook).getController(),
            "MarginPool: Sender is not Controller"
        );

        _;
    }

    function transferToPool(
        address _asset,
        address _user,
        uint256 _amount
    ) external payable onlyController returns (bool success) {
        require(_amount > 0, "MarginPool: invalid amount");

        // get asset decimals
        uint8 assetDecimal = ERC20Interface(_asset).decimals();
        // scale amount
        uint256 val = _calcTransferAmount(_amount, assetDecimal);
        // transfer val from _user to pool
        ERC20Interface(_asset).transferFrom(_user, address(this), val);
    }

    /**
     * @notice Scale _amt
     * @param _amt amount of tokens
     * @param _decimals token decimals
     * @return scaled amount
     */
    function _calcTransferAmount(uint256 _amt, uint256 _decimals) internal returns (uint256) {
        return _amt.div(BASE_UNIT.sub(_decimals));
    }
}
