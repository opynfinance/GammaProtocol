# `ChainLinkPricer`

A Pricer contract for one asset as reported by Chainlink

## Functions:

- `constructor(address _asset, address _aggregator, address _oracle) (public)`

- `getPrice() (external)`

- `setExpiryPriceInOracle(uint256 _expiryTimestamp, uint256 _roundId) (external)`

### Function `constructor(address _asset, address _aggregator, address _oracle) public`

#### Parameters:

- `_asset`: asset that this pricer will get a price for

- `_aggregator`: Chainlink aggregator contract for the asset

- `_oracle`: Opyn Oracle address

### Function `getPrice() → uint256 external`

get the live price for the asset

overides the getPrice function in OpynPricerInterface

#### Return Values:

- price of the asset in USD, scaled by 1e8

### Function `setExpiryPriceInOracle(uint256 _expiryTimestamp, uint256 _roundId) external`

set the expiry price in the oracle

a roundId must be provided to confirm price validity, which is the first Chainlink price provided after the expiryTimestamp

#### Parameters:

- `_expiryTimestamp`: expiry to set a price for

- `_roundId`: the first roundId after expiryTimestamp
