# `USDCPricer`

A Pricer contract for USDC

## Functions:

- `constructor(address _usdc, address _oracle) (public)`

- `getPrice() (external)`

- `setExpiryPriceInOracle(uint256 _expiryTimestamp) (external)`

### Function `constructor(address _usdc, address _oracle) public`

### Function `getPrice() → uint256 external`

get the live price for USDC, which always returns 1

overrides the getPrice function in OpynPricerInterface

#### Return Values:

- price of USDC in USD, scaled by 1e8

### Function `setExpiryPriceInOracle(uint256 _expiryTimestamp) external`

set the expiry price in the oracle

#### Parameters:

- `_expiryTimestamp`: expiry to set a price for
