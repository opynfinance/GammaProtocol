# `YearnPricer`

A Pricer contract for a Yearn yToken

## Functions:

- `constructor(address _yToken, address _underlying, address _oracle) (public)`

- `getPrice() (external)`

- `setExpiryPriceInOracle(uint256 _expiryTimestamp) (external)`

- `getHistoricalPrice(uint80 _roundId) (external)`

### Function `constructor(address _yToken, address _underlying, address _oracle) public`

#### Parameters:

- `_yToken`: yToken asset

- `_underlying`: underlying asset for this yToken

- `_oracle`: Opyn Oracle contract address

### Function `getPrice() → uint256 external`

get the live price for the asset

overrides the getPrice function in OpynPricerInterface

#### Return Values:

- price of 1e8 yToken in USD, scaled by 1e8

### Function `setExpiryPriceInOracle(uint256 _expiryTimestamp) external`

set the expiry price in the oracle

requires that the underlying price has been set before setting a yToken price

#### Parameters:

- `_expiryTimestamp`: expiry to set a price for

### Function `getHistoricalPrice(uint80 _roundId) → uint256, uint256 external`
