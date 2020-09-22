## `USDCPricer`

A Pricer contract for USDC.

### `constructor(address _usdc, address _oracle)` (public)

### `getPrice() → uint256` (external)

get live price for USDC, always return 1

overides the getPrice function in OpynPricerInterface.

### `setExpiryPriceToOralce(uint256 _expiryTimestamp)` (external)

Set the expiry price to the oracle
