/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import {ERC20Interface} from "./interfaces/ERC20Interface.sol";
import {AddressBookInterface} from "./interfaces/AddressBookInterface.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";
import {WETH9} from "./packages/canonical-weth/WETH9.sol";

/**
 * @author Opyn Team
 * @title MarginPool
 * @notice contract that hold all protocol funds
 */
contract MarginPool {
    using SafeMath for uint256;

    /// @notice scaling unit
    uint256 public constant BASE_UNIT = 1e18;

    /// @notice AddressBook module
    address public addressBook;

    /// @notice WETH token
    WETH9 public WETH;

    /**
     * @notice contructor
     * @param _addressBook adressbook module
     */
    constructor(address _addressBook) public {
        require(_addressBook != address(0), "Invalid address book");

        addressBook = _addressBook;

        WETH = WETH9(payable(AddressBookInterface(addressBook).getWeth()));
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
     * @notice fallback function to reveive ETH
     */
    receive() external payable {}

    /**
     * @notice transfers asset from user to pool
     * @dev all tokens are scaled to have 1e18 precision in contracts,
     *      so amounts are scaled down to native token decimals using _calcTransferAmount().
     *      If _asset equal to WETH address, transfer WETH from Controller address to pool
     * @param _asset address of asset to transfer
     * @param _user address of user to transfer assets from
     * @param _amount amount of token to transfer from _user, scaled to 1e18 of precision
     * @return true if successful transfer
     */
    function transferToPool(
        address _asset,
        address _user,
        uint256 _amount
    ) external onlyController returns (bool) {
        require(_amount > 0, "MarginPool: transferToPool amount is below 0");

        // get asset decimals
        uint8 assetDecimal = ERC20Interface(_asset).decimals();
        // scale amount
        uint256 val = _calcTransferAmount(_amount, assetDecimal);

        bool success;

        /// check if asset is WETH or not, if WETH transfer the val from Controller address
        if (_asset == address(WETH)) {
            // tranfer WETH from controller to pool
            success = ERC20Interface(_asset).transferFrom(msg.sender, address(this), val);
        } else {
            // transfer val from _user to pool
            success = ERC20Interface(_asset).transferFrom(_user, address(this), val);
        }

        return success;
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
        address payable _user,
        uint256 _amount
    ) external onlyController returns (bool) {
        require(_amount > 0, "MarginPool: transferToUser amount is below 0");

        // get asset decimals
        uint8 assetDecimal = ERC20Interface(_asset).decimals();
        // scale amount
        uint256 val = _calcTransferAmount(_amount, assetDecimal);

        // check if asset is WETH or not, if WETH transfer the val from pool to Controller address
        if (_asset == address(WETH)) {
            // unwrap WETH
            WETH.withdraw(val);
            // transfer ETH to user
            _user.transfer(val);

            return true;
        } else {
            // transfer asset val from Pool to _user
            return ERC20Interface(_asset).transfer(_user, val);
        }
    }

    /**
     * @notice Scale _amt
     * @param _amt amount of tokens
     * @param _decimals token decimals
     * @return scaled amount
     */
    function _calcTransferAmount(uint256 _amt, uint256 _decimals) internal pure returns (uint256) {
        return _amt.div(BASE_UNIT.sub(_decimals));
    }
}
