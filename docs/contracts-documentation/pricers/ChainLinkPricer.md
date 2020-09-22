# `ChainLinkPricer`

A Pricer contract for Chainlink for 1 asset

## Functions:

- `constructor(address _asset, address _aggregator, address _oracle) (public)`

- `getPrice() (external)`

- `setExpiryPriceToOralce(uint256 _expiryTimestamp, uint256 _roundId) (external)`

### Function `constructor(address _asset, address _aggregator, address _oracle) public`

#### Parameters:

- `_asset`: the asset type that this pricer help relay

- `_aggregator`: the ChainLink aggregator contract for this asset

- `_oracle`: the Opyn Oracle contract address.

### Function `getPrice() → uint256 external`

get live price for the asset.

overides the getPrice function in OpynPricerInterface.

#### Return Values:

- price of asset scaled by 1e18

### Function `setExpiryPriceToOralce(uint256 _expiryTimestamp, uint256 _roundId) external`

Set the expiry price to the oracle

#### Parameters:

- `_expiryTimestamp`: the expiry want to send

- `_roundId`: the first roundId after expiry
