# Functions:

- [`constructor(address _cToken, address _underlying, address _underlyingPricer, address _oracle)`]

- [`getPrice()`]

- [`setExpiryPriceToOralce(uint256 _expiryTimestamp)`]

# Function `constructor(address _cToken, address _underlying, address _underlyingPricer, address _oracle)` {#CompoundPricer-constructor-address-address-address-address-}

No description

## Parameters:

- `_cToken`: the asset type

- `_underlying`: the underlying asset for this cToken

- `_underlyingPricer`: the pricer for cToken's underlying

- `_oracle`: the Opyn Oracle contract address.

# Function `getPrice() → uint256` {#CompoundPricer-getPrice--}

overides the getPrice function in OpynPricerInterface.

## Return Values:

- price of 1e8 cToken worth in USD, scaled by 1e18.

# Function `setExpiryPriceToOralce(uint256 _expiryTimestamp)` {#CompoundPricer-setExpiryPriceToOralce-uint256-}

No description

## Parameters:

- `_expiryTimestamp`: the expiry want to send
