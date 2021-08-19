# `WstethPricer`

A Pricer contract for a wstETH token

## Functions:

- `constructor(address _wstETH, address _underlying, address _oracle) (public)`

- `getPrice() (external)`

- `setExpiryPriceInOracle(uint256 _expiryTimestamp) (external)`

- `getHistoricalPrice(uint80) (external)`

### Function `constructor(address _wstETH, address _underlying, address _oracle) public`

#### Parameters:

- `_wstETH`: wstETH

- `_underlying`: underlying asset for wstETH

- `_oracle`: Opyn Oracle contract address

### Function `getPrice() → uint256 external`

get the live price for the asset

overrides the getPrice function in OpynPricerInterface

#### Return Values:

- price of 1 wstETH in USD, scaled by 1e8

### Function `setExpiryPriceInOracle(uint256 _expiryTimestamp) external`

set the expiry price in the oracle

requires that the underlying price has been set before setting a wstETH price

#### Parameters:

- `_expiryTimestamp`: expiry to set a price for

### Function `getHistoricalPrice(uint80) → uint256, uint256 external`
