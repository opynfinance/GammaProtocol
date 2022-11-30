// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * @notice A Pricer contract for one asset as reported by Manual entity
 */
contract ManualPricer is OpynPricerInterface {
    using SafeMath for uint256;

    /// @notice the opyn oracle address
    OracleInterface public oracle;

    /// @notice asset that this pricer will a get price for
    address public asset;
    /// @notice bot address that is allowed to call setExpiryPriceInOracle
    address public bot;

    /// @notice lastExpiryTimestamp last timestamp that asset price was set
    uint256 public lastExpiryTimestamp;

    /// @notice historicalPrice mapping of timestamp to price
    mapping(uint256 => uint256) public historicalPrice;

    /**
     * @param _bot priveleged address that can call setExpiryPriceInOracle
     * @param _asset asset that this pricer will get a price for
     * @param _oracle Opyn Oracle address
     */
    constructor(
        address _bot,
        address _asset,
        address _oracle
    ) public {
        require(_bot != address(0), "ManualPricer: Cannot set 0 address as bot");
        require(_oracle != address(0), "ManualPricer: Cannot set 0 address as oracle");

        bot = _bot;
        oracle = OracleInterface(_oracle);
        asset = _asset;
    }

    /**
     * @notice modifier to check if sender address is equal to bot address
     */
    modifier onlyBot() {
        require(msg.sender == bot, "ManualPricer: unauthorized sender");

        _;
    }

    /**
     * @notice set the expiry price in the oracle, can only be called by Bot address
     * @param _expiryTimestamp expiry to set a price for
     * @param _price the price of the asset
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp, uint256 _price) external onlyBot {
        lastExpiryTimestamp = _expiryTimestamp;
        historicalPrice[_expiryTimestamp] = _price;
        oracle.setExpiryPrice(asset, _expiryTimestamp, _price);
    }

    /**
     * @notice get the live price for the asset
     * @dev overides the getPrice function in OpynPricerInterface
     * @return price of the asset in USD, scaled by 1e8
     */
    function getPrice(address) external view override returns (uint256) {
        return historicalPrice[lastExpiryTimestamp];
    }

    /**
     * @notice get historical chainlink price
     * @param _roundId chainlink round id
     * @return round price and timestamp
     */
    function getHistoricalPrice(uint80 _roundId) external view override returns (uint256, uint256) {
        revert("ManualPricer: Deprecated");
    }
}
