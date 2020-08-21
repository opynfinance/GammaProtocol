/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import {ERC20Interface} from "./interfaces/ERC20Interface.sol";
import {AddressBookInterface} from "./interfaces/AddressBookInterface.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";

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
     * @dev all tokens are scaled to have 1e18 precision in contracts, but are scaled to native
     *      token decimals in Controller before being passed to MarginPool
     * @param _asset address of asset to transfer
     * @param _user address of user to transfer assets from
     * @param _amount amount of token to transfer from _user, scaled to 1e18 of precision
     * @return true if successful transfer
     */
    function transferToPool(
        address _asset,
        address _user,
        uint256 _amount
    ) public onlyController returns (bool) {
        require(_amount > 0, "MarginPool: transferToPool amount is below or equal to 0");

        // transfer val from _user to pool
        return ERC20Interface(_asset).transferFrom(_user, address(this), _amount);
    }

    /**
     * @notice transfers asset from pool to user
     * @dev all tokens are scaled to have 1e18 precision in contracts, but are scaled to native
     *      token decimals in Controller before being passed to MarginPool
     * @param _asset address of asset to transfer
     * @param _user address of user to transfer assets to
     * @param _amount amount of token to transfer to _user, scaled to 1e18 of precision
     * @return true if successful transfer
     */
    function transferToUser(
        address _asset,
        address payable _user,
        uint256 _amount
    ) public onlyController returns (bool) {
        require(_amount > 0, "MarginPool: transferToUser amount is below or equal to 0");

        // transfer asset val from Pool to _user
        return ERC20Interface(_asset).transfer(_user, _amount);
    }

    /**
     * @notice transfers multiple assets from users to pool
     * @dev all tokens are scaled to have 1e18 precision in contracts, but are scaled to native
     *      token decimals in Controller before being passed to MarginPool
     * @param _asset addresses of assets to transfer
     * @param _user addresses of users to transfer assets to
     * @param _amount amount of each token to transfer to _user, scaled to 1e18 of precision
     */
    function batchTransferToPool(
        address[] memory _asset,
        address[] memory _user,
        uint256[] memory _amount
    ) external onlyController {
        require(
            _asset.length == _user.length && _user.length == _amount.length,
            "MarginPool: batchTransferToPool array lengths are not equal"
        );

        for (uint256 i = 0; i < _asset.length; i++) {
            // transfer val from _user to pool
            require(transferToPool(_asset[i], _user[i], _amount[i]), "MarginPool: Transfer to pool failed");
        }
    }

    /**
     * @notice transfers multiple assets from pool to users
     * @dev all tokens are scaled to have 1e18 precision in contracts, but are scaled to native
     *      token decimals in Controller before being passed to MarginPool
     * @param _asset addresses of assets to transfer
     * @param _user addresses of users to transfer assets to
     * @param _amount amount of each token to transfer to _user, scaled to 1e18 of precision
     */
    function batchTransferToUser(
        address[] memory _asset,
        address payable[] memory _user,
        uint256[] memory _amount
    ) external onlyController {
        require(
            _asset.length == _user.length && _user.length == _amount.length,
            "MarginPool: batchTransferToUser array lengths are not equal"
        );

        for (uint256 i = 0; i < _asset.length; i++) {
            // transfer val from Pool to _pool
            require(transferToUser(_asset[i], _user[i], _amount[i]), "MarginPool: Transfer to user failed");
        }
    }
}
