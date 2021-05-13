# `CompoundPricer`

A Pricer contract for a Compound cToken

## Functions:

- `constructor(address _cToken, address _underlying, address _oracle) (public)`

- `getPrice() (external)`

- `setExpiryPriceInOracle(uint256 _expiryTimestamp) (external)`

- `_underlyingPriceToCtokenPrice(uint256 _underlyingPrice) (internal)`

### Function `constructor(address _cToken, address _underlying, address _oracle) public`

#### Parameters:

- `_cToken`: cToken asset

- `_underlying`: underlying asset for this cToken

- `_oracle`: Opyn Oracle contract address

### Function `getPrice() → uint256 external`

get the live price for the asset

#### Return Values:

- price of 1e8 cToken in USD, scaled by 1e8

### Function `setExpiryPriceInOracle(uint256 _expiryTimestamp) external`

set the expiry price in the oracle

requires that the underlying price has been set before setting a cToken price

#### Parameters:

- `_expiryTimestamp`: expiry to set a price for

### Function `_underlyingPriceToCtokenPrice(uint256 _underlyingPrice) → uint256 internal`

convert underlying price to cToken price with the cToken to underlying exchange rate

#### Parameters:

- `_underlyingPrice`: price of 1 underlying token (ie 1e6 USDC, 1e18 WETH) in USD, scaled by 1e8

#### Return Values:

- price of 1e8 cToken in USD, scaled by 1e8
