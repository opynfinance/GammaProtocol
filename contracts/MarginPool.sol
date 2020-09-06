/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import {ERC20Interface} from "./interfaces/ERC20Interface.sol";
import {AddressBookInterface} from "./interfaces/AddressBookInterface.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";
import {Ownable} from "./packages/oz/Ownable.sol";

/**
 * @author Opyn Team
 * @title MarginPool
 * @notice contract that hold all protocol funds
 */
contract MarginPool is Ownable {
    using SafeMath for uint256;

    /// @notice AddressBook module
    address public addressBook;
    /// @dev the address that have access to withdraw excess funds
    address public harvester;
    /// @dev mapping between an assetl and balance amount in the pool
    mapping(address => uint256) internal assetBalance;

    /**
     * @notice contructor
     * @param _addressBook adressbook module
     */
    constructor(address _addressBook) public {
        require(_addressBook != address(0), "Invalid address book");

        addressBook = _addressBook;
    }

    /// @notice emit event after updating the harvester address
    event HarvesterUpdated(address indexed oldAddress, address indexed newAddress);
    /// @notice emit event when an asset get harvested
    event AssetHarvested(address indexed asset, address indexed receiver, uint256 _amount);

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
     * @notice check if the sender is the harvester address
     */
    modifier onlyHarvester() {
        require(msg.sender == harvester, "MarginPool: Sender is not harvester");

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
        require(_amount > 0, "MarginPool: transferToPool amount is equal to 0");

        assetBalance[_asset] = assetBalance[_asset].add(_amount);

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
        require(_amount > 0, "MarginPool: transferToUser amount is equal to 0");

        assetBalance[_asset] = assetBalance[_asset].sub(_amount);

        // transfer asset val from Pool to _user
        return ERC20Interface(_asset).transfer(_user, _amount);
    }

    /**
     * @notice get asset stored balance
     * @param _asset asset address
     * @return asset balance
     */
    function getStoredBalance(address _asset) public view returns (uint256) {
        return assetBalance[_asset];
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

    /**
     * @notice function to collect excess balance
     * @dev can only be called by harvester address
     * @param _asset asset address
     * @param _receiver receiver address
     * @param _amount amount to harvest
     */
    function harvest(
        address _asset,
        address _receiver,
        uint256 _amount
    ) external onlyHarvester {
        require(_receiver != address(0), "MarginPool: invalid receiver address");

        uint256 externalBalance = ERC20Interface(_asset).balanceOf(address(this));
        uint256 storedBalance = getStoredBalance(_asset);

        require(_amount <= externalBalance.sub(storedBalance), "MarginPool: amount exceed limit");

        ERC20Interface(_asset).transfer(_receiver, _amount);

        emit AssetHarvested(_asset, _receiver, _amount);
    }

    /**
     * @notice function to set harvester address
     * @dev can only be called by MarginPool owner
     * @param _harvester harvester address
     */
    function setHarvester(address _harvester) external onlyOwner {
        emit HarvesterUpdated(harvester, _harvester);

        harvester = _harvester;
    }
}
