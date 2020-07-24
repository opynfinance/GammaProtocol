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

    /**
     * @notice transfers asset from user to pool
     * @dev all tokens are scaled to have 1e18 precision in contracts,
     *      so amounts are scaled down to native token decimals using _calcTransferAmount()
     * @param _asset address of asset to transfer
     * @param _user address of user to transfer assets from
     * @param _amount amount of token to transfer from _user, scaled to 1e18 of precision
     * @return true if successful transfer
     */
    function transferToPool(
        address _asset,
        address _user,
        uint256 _amount
    ) external payable onlyController returns (bool) {
        require(_amount > 0, "MarginPool: transferToPool amount is below 0");

        // get asset decimals
        uint8 assetDecimal = ERC20Interface(_asset).decimals();
        // scale amount
        uint256 val = _calcTransferAmount(_amount, assetDecimal);
        // transfer val from _user to pool
        return ERC20Interface(_asset).transferFrom(_user, address(this), val);
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

    /**
     * @notice transfers asset from pool to user
     * @dev all tokens are scaled to have 1e18 precision in contracts,
     *      so amounts are scaled down to native token decimals using _calcTransferAmount()
     * @param _asset address of asset to transfer
     * @param _user address of user to transfer assets to
     * @param _amount amount of token to transfer to _user, scaled to 1e18 of precision
     * @return true if successful transfer
     */
    function transferToUser(
        address _asset,
        address _user,
        uint256 _amount
    ) external onlyController returns (bool) {
        require(_amount > 0, "MarginPool: transferToUser amount is below 0");
        // get asset decimals
        uint8 assetDecimal = ERC20Interface(_asset).decimals();
        // scale amount
        uint256 val = _calcTransferAmount(_amount, assetDecimal);
        // transfer val from pool to _user
        return ERC20Interface(_asset).transfer(_user, val);
    }
}
