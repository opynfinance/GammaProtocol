# Functions:

- [`constructor(address _asset, address _aggregator, address _oracle)`](#ChainLinkPricer-constructor-address-address-address-)

- [`getPrice()`](#ChainLinkPricer-getPrice--)

- [`setExpiryPriceToOralce(uint256 _expiryTimestamp, uint256 _roundId)`](#ChainLinkPricer-setExpiryPriceToOralce-uint256-uint256-)

# Function `constructor(address _asset, address _aggregator, address _oracle)` {#ChainLinkPricer-constructor-address-address-address-}

No description

## Parameters:

- `_asset`: the asset type that this pricer help relay

- `_aggregator`: the ChainLink aggregator contract for this asset

- `_oracle`: the Opyn Oracle contract address.

# Function `getPrice() → uint256` {#ChainLinkPricer-getPrice--}

overides the getPrice function in OpynPricerInterface.

## Return Values:

- price of asset scaled by 1e18

# Function `setExpiryPriceToOralce(uint256 _expiryTimestamp, uint256 _roundId)` {#ChainLinkPricer-setExpiryPriceToOralce-uint256-uint256-}

No description

## Parameters:

- `_expiryTimestamp`: the expiry want to send

- `_roundId`: the first roundId after expiry
