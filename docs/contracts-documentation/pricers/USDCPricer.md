# Functions:

- [`constructor(address _usdc, address _oracle)`](#USDCPricer-constructor-address-address-)

- [`getPrice()`](#USDCPricer-getPrice--)

- [`setExpiryPriceToOralce(uint256 _expiryTimestamp)`](#USDCPricer-setExpiryPriceToOralce-uint256-)

# Function `constructor(address _usdc, address _oracle)` {#USDCPricer-constructor-address-address-}

No description

# Function `getPrice() → uint256` {#USDCPricer-getPrice--}

overides the getPrice function in OpynPricerInterface.

## Return Values:

- price of 1e8 cToken worth in USD, scaled by 1e18.

# Function `setExpiryPriceToOralce(uint256 _expiryTimestamp)` {#USDCPricer-setExpiryPriceToOralce-uint256-}

No description

## Parameters:

- `_expiryTimestamp`: the expiry want to send
