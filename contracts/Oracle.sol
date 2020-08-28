/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import "./interfaces/AddressBookInterface.sol";
import "./packages/oz/Ownable.sol";
import "./packages/oz/SafeMath.sol";

/**
 * @author Opyn Team
 * @title Oracle Module
 * @notice The Oracle module provide the system with on-chain prices
 */
contract Oracle is Ownable {
    using SafeMath for uint256;

    /// @dev structure that represent price, and timestamp
    struct Price {
        uint256 price;
        uint256 timestamp; // timestamp at which the price is pushed to this oracle
    }

    /// @dev mapping between pricer and it's locking period.
    /// locking period is a period of time after expiry timestamp, that preventing from pushing asset price.
    mapping(address => uint256) internal pricerLockingPeriod;
    /// @dev mapping of asset pricer to it's dispute period. Dispute period start from the timestamp of pushing underyling price
    mapping(address => uint256) internal pricerDisputePeriod;
    /// @dev mapping between asset and its pricer.
    mapping(address => address) internal assetPricer;
    /// @dev mapping between asset, timestamp and the price at the timestamp.
    mapping(address => mapping(uint256 => Price)) internal storedPrice;

    /// @notice emits an event when an pricer updated for a specific asset
    event PricerUpdated(address asset, address pricer);
    /// @notice emits an event when a locking period updated for a specific oracle
    event PricerLockingPeriodUpdated(address indexed pricer, uint256 lockingPeriod);
    /// @notice emits an event when a dispute period updated for a specific oracle
    event PricerDisputePeriodUpdated(address indexed pricer, uint256 disputePeriod);
    /// @notice emits an event when price is updated for a specific asset
    event ExpiryPriceUpdated(
        address indexed asset,
        uint256 indexed expirtyTimestamp,
        uint256 price,
        uint256 onchainTimestamp
    );
    /// @notice emits an event when owner dispute a asset price during dispute period
    event ExpiryPriceDisputed(
        address indexed asset,
        uint256 indexed expiryTimestamp,
        uint256 disputedPrice,
        uint256 newPrice,
        uint256 disputeTimestamp
    );

    /// @notice AddressBook module
    address public addressBook;

    /**
     * @notice contructor
     * @param _addressBook adressbook module
     */
    constructor(address _addressBook) public {
        require(_addressBook != address(0), "Oracle: Invalid address book");

        addressBook = _addressBook;
    }

    /**
     * @notice get the asset price at specific expiry timestamp.
     * @param _asset the asset want to get price at.
     * @param _expiryTimestamp expiry timestamp
     * @return price denominated in USD, scaled 10e18
     * @return isFinalized if the price is finalized or not.
     */
    function getExpiryPrice(address _asset, uint256 _expiryTimestamp) external view returns (uint256, bool) {
        uint256 price = storedPrice[_asset][_expiryTimestamp].price;
        bool isFinalized = isDisputePeriodOver(_asset, _expiryTimestamp);
        return (price, isFinalized);
    }

    /**
     * @notice get asset pricer
     * @param _asset get the pricer for a specific asset.
     * @return pricer address
     */
    function getPricer(address _asset) external view returns (address) {
        return assetPricer[_asset];
    }

    /**
     * @notice get pricer locking period. A locking period is a period of time after expiry where no one can push price to oracle
     * @dev during locking period, price can not be submitted to this contract
     * @param _pricer pricer address
     * @return locking period
     */
    function getPricerLockingPeriod(address _pricer) external view returns (uint256) {
        return pricerLockingPeriod[_pricer];
    }

    /**
     * @notice get pricer dispute period
     * @dev during dispute period, the owner of this contract can dispute the submitted price and modify it.
     * The dispute period start after submitting a price on-chain
     * @param _pricer oracle address
     * @return dispute period
     */
    function getPricerDisputePeriod(address _pricer) external view returns (uint256) {
        return pricerDisputePeriod[_pricer];
    }

    /**
     * @notice check if locking period is over for setting the asset price for that timestamp
     * @param _asset asset address
     * @param _expiryTimestamp expiry timestamp
     * @return True if locking period is over, otherwise false
     */
    function isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) public view returns (bool) {
        address pricer = assetPricer[_asset];
        uint256 lockingPeriod = pricerLockingPeriod[pricer];

        return now > _expiryTimestamp.add(lockingPeriod);
    }

    /**
     * @notice check if dispute period is over
     * @param _asset assets to query
     * @param _expiryTimestamp expiry timestamp of otoken
     * @return True if dispute period is over, otherwise false
     */
    function isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) public view returns (bool) {
        // check if the pricer has submitted the price at this tiestamp
        Price memory price = storedPrice[_asset][_expiryTimestamp];
        if (price.timestamp == 0) {
            return false;
        }

        address pricer = assetPricer[_asset];
        uint256 disputePeriod = pricerDisputePeriod[pricer];
        return now > price.timestamp.add(disputePeriod);
    }

    /**
     * @notice set pricer for an asset
     * @dev can only be called by owner
     * @param _asset asset
     * @param _pricer pricer address
     */
    function setAssetPricer(address _asset, address _pricer) external onlyOwner {
        require(_pricer != address(0), "Oracle: cannot set pricer to address(0)");
        assetPricer[_asset] = _pricer;

        emit PricerUpdated(_asset, _asset);
    }

    /**
     * @notice set pricer locking period
     * @dev this function can only be called by owner
     * @param _pricer pricer address
     * @param _lockingPeriod locking period
     */
    function setLockingPeriod(address _pricer, uint256 _lockingPeriod) external onlyOwner {
        pricerLockingPeriod[_pricer] = _lockingPeriod;

        emit PricerLockingPeriodUpdated(_pricer, _lockingPeriod);
    }

    /**
     * @notice set oracle dispute period
     * @dev can only be called by owner
     * @param _pricer oracle address
     * @param _disputePeriod dispute period
     */
    function setDisputePeriod(address _pricer, uint256 _disputePeriod) external onlyOwner {
        pricerDisputePeriod[_pricer] = _disputePeriod;

        emit PricerDisputePeriodUpdated(_pricer, _disputePeriod);
    }

    /**
     * @notice dispute an asset price by owner during dispute period
     * @dev only owner can dispute a price during the dispute period, by setting a new one.
     * @param _asset asset address
     * @param _expiryTimestamp expiry timestamp
     * @param _price the correct price
     */
    function disputeExpiryPrice(
        address _asset,
        uint256 _expiryTimestamp,
        uint256 _price
    ) external onlyOwner {
        require(!isDisputePeriodOver(_asset, _expiryTimestamp), "Oracle: dispute period over");

        Price storage priceToUpdate = storedPrice[_asset][_expiryTimestamp];
        uint256 oldPrice = priceToUpdate.price;
        priceToUpdate.price = _price;

        emit ExpiryPriceDisputed(_asset, _expiryTimestamp, oldPrice, _price, now);
    }

    /**
     * @notice submit expiry price to the oracle, can only be set from the pricer.
     * @dev asset price can only be set after locking period is over and before starting dispute period
     * @param _asset asset address
     * @param _expiryTimestamp expiry timestamp
     * @param _price the asset price at expiry
     */
    function setExpiryPrice(
        address _asset,
        uint256 _expiryTimestamp,
        uint256 _price
    ) external {
        require(msg.sender == assetPricer[_asset], "Oracle: caller is not the pricer");
        require(isLockingPeriodOver(_asset, _expiryTimestamp), "Oracle: locking period is not over yet");
        require(storedPrice[_asset][_expiryTimestamp].timestamp == 0, "Oracle: dispute period started");

        storedPrice[_asset][_expiryTimestamp] = Price(_price, now);
        emit ExpiryPriceUpdated(_asset, _expiryTimestamp, _price, now);
    }
}
