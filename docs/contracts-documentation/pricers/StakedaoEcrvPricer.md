# `StakedaoPricer`

A Pricer contract for a Stakedao lpToken

## Functions:

- `constructor(address _lpToken, address _underlying, address _oracle, address _curve) (public)`

- `getPrice() (external)`

- `setExpiryPriceInOracle(uint256 _expiryTimestamp) (external)`

- `getHistoricalPrice(uint80) (external)`

### Function `constructor(address _lpToken, address _underlying, address _oracle, address _curve) public`

#### Parameters:

- `_lpToken`: lpToken asset

- `_underlying`: underlying asset for this lpToken

- `_oracle`: Opyn Oracle contract address

- `_curve`: curve pool contract address

### Function `getPrice() → uint256 external`

get the live price for the asset

overrides the getPrice function in OpynPricerInterface

#### Return Values:

- price of 1 lpToken in USD, scaled by 1e8

### Function `setExpiryPriceInOracle(uint256 _expiryTimestamp) external`

set the expiry price in the oracle

requires that the underlying price has been set before setting a lpToken price

#### Parameters:

- `_expiryTimestamp`: expiry to set a price for

### Function `getHistoricalPrice(uint80) → uint256, uint256 external`
