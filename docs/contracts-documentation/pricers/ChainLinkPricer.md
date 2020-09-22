## `ChainLinkPricer`

A Pricer contract for Chainlink for 1 asset

### `constructor(address _asset, address _aggregator, address _oracle)` (public)

### `getPrice() → uint256` (external)

get live price for the asset.

overides the getPrice function in OpynPricerInterface.

### `setExpiryPriceToOralce(uint256 _expiryTimestamp, uint256 _roundId)` (external)

Set the expiry price to the oracle
