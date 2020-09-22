## `CompoundPricer`

A Pricer contract for Compound Asset.

### `constructor(address _cToken, address _underlying, address _underlyingPricer, address _oracle)` (public)

### `getPrice() → uint256` (external)

get live price for the asset.

overides the getPrice function in OpynPricerInterface.

### `setExpiryPriceToOralce(uint256 _expiryTimestamp)` (external)

Set the expiry price to the oracle

### `_underlyingPriceToCtokenPrice(uint256 _underlyingPrice) → uint256` (internal)

convert underlying price to cToken price.
