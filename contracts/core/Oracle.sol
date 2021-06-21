/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;

import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";
import {Ownable} from "../packages/oz/Ownable.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * @author Opyn Team
 * @title Oracle Module
 * @notice The Oracle module sets, retrieves, and stores USD prices (USD per asset) for underlying, collateral, and strike assets
 * manages pricers that are used for different assets
 */
contract Oracle is Ownable {
    using SafeMath for uint256;

    /// @dev structure that stores price of asset and timestamp when the price was stored
    struct Price {
        uint256 price;
        uint256 timestamp; // timestamp at which the price is pushed to this oracle
    }

    //// @dev disputer is a role defined by the owner that has the ability to dispute a price during the dispute period
    address internal disputer;

    bool migrated;

    /// @dev mapping of asset pricer to its locking period
    /// locking period is the period of time after the expiry timestamp where a price can not be pushed
    mapping(address => uint256) internal pricerLockingPeriod;
    /// @dev mapping of asset pricer to its dispute period
    /// dispute period is the period of time after an expiry price has been pushed where a price can be disputed
    mapping(address => uint256) internal pricerDisputePeriod;
    /// @dev mapping between an asset and its pricer
    mapping(address => address) internal assetPricer;
    /// @dev mapping between asset, expiry timestamp, and the Price structure at the expiry timestamp
    mapping(address => mapping(uint256 => Price)) internal storedPrice;
    /// @dev mapping between stable asset and price
    mapping(address => uint256) internal stablePrice;

    /// @notice emits an event when the disputer is updated
    event DisputerUpdated(address indexed newDisputer);
    /// @notice emits an event when the pricer is updated for an asset
    event PricerUpdated(address indexed asset, address indexed pricer);
    /// @notice emits an event when the locking period is updated for a pricer
    event PricerLockingPeriodUpdated(address indexed pricer, uint256 lockingPeriod);
    /// @notice emits an event when the dispute period is updated for a pricer
    event PricerDisputePeriodUpdated(address indexed pricer, uint256 disputePeriod);
    /// @notice emits an event when an expiry price is updated for a specific asset
    event ExpiryPriceUpdated(
        address indexed asset,
        uint256 indexed expiryTimestamp,
        uint256 price,
        uint256 onchainTimestamp
    );
    /// @notice emits an event when the disputer disputes a price during the dispute period
    event ExpiryPriceDisputed(
        address indexed asset,
        uint256 indexed expiryTimestamp,
        uint256 disputedPrice,
        uint256 newPrice,
        uint256 disputeTimestamp
    );
    /// @notice emits an event when a stable asset price changes
    event StablePriceUpdated(address indexed asset, uint256 price);

    /**
     * @notice function to mgirate asset prices from old oracle to new deployed oracle
     * @dev this can only be called by owner, should be used at the deployment time before setting Oracle module into AddressBook
     * @param _asset asset address
     * @param _expiries array of expiries timestamps
     * @param _prices array of prices
     */
    function migrateOracle(
        address _asset,
        uint256[] calldata _expiries,
        uint256[] calldata _prices
    ) external onlyOwner {
        require(!migrated, "Oracle: migration already done");
        require(_expiries.length == _prices.length, "Oracle: invalid migration data");

        for (uint256 i; i < _expiries.length; i++) {
            storedPrice[_asset][_expiries[i]] = Price(_prices[i], now);
        }
    }

    /**
     * @notice end migration process
     * @dev can only be called by owner, should be called before setting Oracle module into AddressBook
     */
    function endMigration() external onlyOwner {
        migrated = true;
    }

    /**
     * @notice sets the pricer for an asset
     * @dev can only be called by the owner
     * @param _asset asset address
     * @param _pricer pricer address
     */
    function setAssetPricer(address _asset, address _pricer) external onlyOwner {
        require(_pricer != address(0), "Oracle: cannot set pricer to address(0)");
        require(stablePrice[_asset] == 0, "Oracle: could not set a pricer for stable asset");

        assetPricer[_asset] = _pricer;

        emit PricerUpdated(_asset, _pricer);
    }

    /**
     * @notice sets the locking period for a pricer
     * @dev can only be called by the owner
     * @param _pricer pricer address
     * @param _lockingPeriod locking period
     */
    function setLockingPeriod(address _pricer, uint256 _lockingPeriod) external onlyOwner {
        pricerLockingPeriod[_pricer] = _lockingPeriod;

        emit PricerLockingPeriodUpdated(_pricer, _lockingPeriod);
    }

    /**
     * @notice sets the dispute period for a pricer
     * @dev can only be called by the owner
     * for a composite pricer (ie CompoundPricer) that depends on or calls other pricers, ensure
     * that the dispute period for the composite pricer is longer than the dispute period for the
     * asset pricer that it calls to ensure safe usage as a dispute in the other pricer will cause
     * the need for a dispute with the composite pricer's price
     * @param _pricer pricer address
     * @param _disputePeriod dispute period
     */
    function setDisputePeriod(address _pricer, uint256 _disputePeriod) external onlyOwner {
        pricerDisputePeriod[_pricer] = _disputePeriod;

        emit PricerDisputePeriodUpdated(_pricer, _disputePeriod);
    }

    /**
     * @notice set the disputer address
     * @dev can only be called by the owner
     * @param _disputer disputer address
     */
    function setDisputer(address _disputer) external onlyOwner {
        disputer = _disputer;

        emit DisputerUpdated(_disputer);
    }

    /**
     * @notice set stable asset price
     * @dev price should be scaled by 1e8
     * @param _asset asset address
     * @param _price price
     */
    function setStablePrice(address _asset, uint256 _price) external onlyOwner {
        require(assetPricer[_asset] == address(0), "Oracle: could not set stable price for an asset with pricer");

        stablePrice[_asset] = _price;

        emit StablePriceUpdated(_asset, _price);
    }

    /**
     * @notice dispute an asset price during the dispute period
     * @dev only the disputer can dispute a price during the dispute period, by setting a new one
     * @param _asset asset address
     * @param _expiryTimestamp expiry timestamp
     * @param _price the correct price
     */
    function disputeExpiryPrice(
        address _asset,
        uint256 _expiryTimestamp,
        uint256 _price
    ) external {
        require(msg.sender == disputer, "Oracle: caller is not the disputer");
        require(!isDisputePeriodOver(_asset, _expiryTimestamp), "Oracle: dispute period over");

        Price storage priceToUpdate = storedPrice[_asset][_expiryTimestamp];

        require(priceToUpdate.timestamp != 0, "Oracle: price to dispute does not exist");

        uint256 oldPrice = priceToUpdate.price;
        priceToUpdate.price = _price;

        emit ExpiryPriceDisputed(_asset, _expiryTimestamp, oldPrice, _price, now);
    }

    /**
     * @notice submits the expiry price to the oracle, can only be set from the pricer
     * @dev asset price can only be set after the locking period is over and before the dispute period has started
     * @param _asset asset address
     * @param _expiryTimestamp expiry timestamp
     * @param _price asset price at expiry
     */
    function setExpiryPrice(
        address _asset,
        uint256 _expiryTimestamp,
        uint256 _price
    ) external {
        require(msg.sender == assetPricer[_asset], "Oracle: caller is not authorized to set expiry price");
        require(isLockingPeriodOver(_asset, _expiryTimestamp), "Oracle: locking period is not over yet");
        require(storedPrice[_asset][_expiryTimestamp].timestamp == 0, "Oracle: dispute period started");

        storedPrice[_asset][_expiryTimestamp] = Price(_price, now);
        emit ExpiryPriceUpdated(_asset, _expiryTimestamp, _price, now);
    }

    /**
     * @notice get a live asset price from the asset's pricer contract
     * @param _asset asset address
     * @return price scaled by 1e8, denominated in USD
     * e.g. 17568900000 => 175.689 USD
     */
    function getPrice(address _asset) external view returns (uint256) {
        uint256 price = stablePrice[_asset];

        if (price == 0) {
            require(assetPricer[_asset] != address(0), "Oracle: Pricer for this asset not set");

            price = OpynPricerInterface(assetPricer[_asset]).getPrice();
        }

        return price;
    }

    /**
     * @notice get the asset price at specific expiry timestamp
     * @param _asset asset address
     * @param _expiryTimestamp expiry timestamp
     * @return price scaled by 1e8, denominated in USD
     * @return isFinalized True, if the price is finalized, False if not
     */
    function getExpiryPrice(address _asset, uint256 _expiryTimestamp) external view returns (uint256, bool) {
        uint256 price = stablePrice[_asset];
        bool isFinalized = true;

        if (price == 0) {
            price = storedPrice[_asset][_expiryTimestamp].price;
            isFinalized = isDisputePeriodOver(_asset, _expiryTimestamp);
        }

        return (price, isFinalized);
    }

    /**
     * @notice get the pricer for an asset
     * @param _asset asset address
     * @return pricer address
     */
    function getPricer(address _asset) external view returns (address) {
        return assetPricer[_asset];
    }

    /**
     * @notice get the disputer address
     * @return disputer address
     */
    function getDisputer() external view returns (address) {
        return disputer;
    }

    /**
     * @notice get a pricer's locking period
     * locking period is the period of time after the expiry timestamp where a price can not be pushed
     * @dev during the locking period an expiry price can not be submitted to this contract
     * @param _pricer pricer address
     * @return locking period
     */
    function getPricerLockingPeriod(address _pricer) external view returns (uint256) {
        return pricerLockingPeriod[_pricer];
    }

    /**
     * @notice get a pricer's dispute period
     * dispute period is the period of time after an expiry price has been pushed where a price can be disputed
     * @dev during the dispute period, the disputer can dispute the submitted price and modify it
     * @param _pricer pricer address
     * @return dispute period
     */
    function getPricerDisputePeriod(address _pricer) external view returns (uint256) {
        return pricerDisputePeriod[_pricer];
    }

    /**
     * @notice get historical asset price and timestamp
     * @dev if asset is a stable asset, will return stored price and timestamp equal to now
     * @param _asset asset address to get it's historical price
     * @param _roundId chainlink round id
     * @return price and round timestamp
     */
    function getChainlinkRoundData(address _asset, uint80 _roundId) external view returns (uint256, uint256) {
        uint256 price = stablePrice[_asset];
        uint256 timestamp = now;

        if (price == 0) {
            require(assetPricer[_asset] != address(0), "Oracle: Pricer for this asset not set");

            (price, timestamp) = OpynPricerInterface(assetPricer[_asset]).getHistoricalPrice(_roundId);
        }

        return (price, timestamp);
    }

    /**
     * @notice check if the locking period is over for setting the asset price at a particular expiry timestamp
     * @param _asset asset address
     * @param _expiryTimestamp expiry timestamp
     * @return True if locking period is over, False if not
     */
    function isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) public view returns (bool) {
        uint256 price = stablePrice[_asset];

        if (price == 0) {
            address pricer = assetPricer[_asset];
            uint256 lockingPeriod = pricerLockingPeriod[pricer];

            return now > _expiryTimestamp.add(lockingPeriod);
        }

        return true;
    }

    /**
     * @notice check if the dispute period is over
     * @param _asset asset address
     * @param _expiryTimestamp expiry timestamp
     * @return True if dispute period is over, False if not
     */
    function isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) public view returns (bool) {
        uint256 price = stablePrice[_asset];

        if (price == 0) {
            // check if the pricer has a price for this expiry timestamp
            Price memory price = storedPrice[_asset][_expiryTimestamp];
            if (price.timestamp == 0) {
                return false;
            }

            address pricer = assetPricer[_asset];
            uint256 disputePeriod = pricerDisputePeriod[pricer];

            return now > price.timestamp.add(disputePeriod);
        }

        return true;
    }
}
