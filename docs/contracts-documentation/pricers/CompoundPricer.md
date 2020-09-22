## `CompoundPricer`

A Pricer contract for Compound Asset.

# Functions:

- `constructor(address _cToken, address _underlying, address _underlyingPricer, address _oracle) (public)`

- `getPrice() (external)`

- `setExpiryPriceToOralce(uint256 _expiryTimestamp) (external)`

- `_underlyingPriceToCtokenPrice(uint256 _underlyingPrice) (internal)`

# Function `constructor(address _cToken, address _underlying, address _underlyingPricer, address _oracle)` (public)

## Parameters:

- `_cToken`: the asset type

- `_underlying`: the underlying asset for this cToken

- `_underlyingPricer`: the pricer for cToken's underlying

- `_oracle`: the Opyn Oracle contract address.

# Function `getPrice() → uint256` (external)

get live price for the asset.

overides the getPrice function in OpynPricerInterface.

## Return Values:

- price of 1e8 cToken worth in USD, scaled by 1e18.

# Function `setExpiryPriceToOralce(uint256 _expiryTimestamp)` (external)

Set the expiry price to the oracle

## Parameters:

- `_expiryTimestamp`: the expiry want to send

# Function `_underlyingPriceToCtokenPrice(uint256 _underlyingPrice) → uint256` (internal)

convert underlying price to cToken price.

## Parameters:

- `_underlyingPrice`: price of 1 underlying token (1e6 USDC, 1e18 WETH) in USD, scled by 1e18

## Return Values:

- net worth of 1e8 cToken in USD, scaled by 1e18.
