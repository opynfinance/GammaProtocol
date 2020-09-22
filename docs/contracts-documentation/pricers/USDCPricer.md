## `USDCPricer`

A Pricer contract for USDC.

# Functions:

- `constructor(address _usdc, address _oracle) (public)`

- `getPrice() (external)`

- `setExpiryPriceToOralce(uint256 _expiryTimestamp) (external)`

# Function `constructor(address _usdc, address _oracle)` (public)

# Function `getPrice() → uint256` (external)

get live price for USDC, always return 1

overides the getPrice function in OpynPricerInterface.

## Return Values:

- price of 1e8 cToken worth in USD, scaled by 1e18.

# Function `setExpiryPriceToOralce(uint256 _expiryTimestamp)` (external)

Set the expiry price to the oracle

## Parameters:

- `_expiryTimestamp`: the expiry want to send
