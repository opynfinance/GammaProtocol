// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {ChainLinkPricer} from "./ChainlinkPricer.sol";
import {IVault} from "../interfaces/YearnVaultInterface.sol";
import {FixedPointInt256 as FPI} from "../libs/FixedPointInt256.sol";

/**
 * @notice A Pricer contract for a vault token as reported by Chainlink and the vault.
 */
contract YearnPricer is ChainLinkPricer {
    /// @notice the yvault address
    IVault public yVault;

    constructor(
        address _bot,
        address _asset,
        address _aggregator,
        address _oracle,
        address _yVault
    ) public ChainLinkPricer(_bot, _asset, _aggregator, _oracle) {
        yVault = IVault(_yVault);
    }

    /**
     * @notice get the live price for the asset
     * @dev overides the getPrice function in OpynPricerInterface
     * @return price of the asset in USD, scaled by 1e8
     */
    function getPrice() external override view returns (uint256) {
        uint256 answer = uint256(aggregator.latestAnswer());
        require(answer > 0, "ChainLinkPricer: price is lower than 0");

        return getYVaultPrice(uint256(answer));
    }

    /**
     * @notice set the expiry price in the oracle, can only be called by Bot address
     * @dev a roundId must be provided to confirm price validity, which is the first Chainlink price provided after the expiryTimestamp
     * @param _expiryTimestamp expiry to set a price for
     * @param _roundId the first roundId after expiryTimestamp
     */
    function setExpiryPriceInOracle(
        uint256 priceInUnderlying,
        uint256 _expiryTimestamp,
        uint256 _roundId
    ) external onlyBot {
        uint256 roundTimestamp = aggregator.getTimestamp(_roundId);

        require(_expiryTimestamp <= roundTimestamp, "ChainLinkPricer: invalid roundId");

        uint256 assetPrice = uint256(aggregator.getAnswer(_roundId));
        uint256 yVaultPrice = getYVaultPrice(uint256(assetPrice));
        oracle.setExpiryPrice(asset, _expiryTimestamp, yVaultPrice);
    }

    /**
     * @notice set the expiry price in the oracle, can only be called by Bot address
     * @dev a roundId must be provided to confirm price validity, which is the first Chainlink price provided after the expiryTimestamp
     * @param _expiryTimestamp expiry to set a price for
     * @param _roundId the first roundId after expiryTimestamp
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp, uint256 _roundId) external override onlyBot {
        revert("Deprecated");
    }

    function getYVaultPrice(uint256 assetPrice) private view returns (uint256) {
        FPI.FixedPointInt memory answer = FPI.fromScaledUint(assetPrice, 10**8);
        FPI.FixedPointInt memory pricePerShare = FPI.fromScaledUint(yVault.getPricePerFullShare(), 10**18);
        uint256 yvPrice = FPI.toScaledUint(FPI.mul(pricePerShare, answer), 8, true);
        return yvPrice;
    }
}
