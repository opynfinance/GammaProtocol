# Functions:

- [`getPrice(address _asset)`]

- [`getExpiryPrice(address _asset, uint256 _expiryTimestamp)`]

- [`getPricer(address _asset)`]

- [`getDisputer()`]

- [`getPricerLockingPeriod(address _pricer)`]

- [`getPricerDisputePeriod(address _pricer)`]

- [`isLockingPeriodOver(address _asset, uint256 _expiryTimestamp)`]

- [`isDisputePeriodOver(address _asset, uint256 _expiryTimestamp)`]

- [`setAssetPricer(address _asset, address _pricer)`]

- [`setLockingPeriod(address _pricer, uint256 _lockingPeriod)`]

- [`setDisputePeriod(address _pricer, uint256 _disputePeriod)`]

- [`setDisputer(address _disputer)`]

- [`disputeExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)`]

- [`setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)`]

# Events:

- [`DisputerUpdated(address newDisputer)`]

- [`PricerUpdated(address asset, address pricer)`]

- [`PricerLockingPeriodUpdated(address pricer, uint256 lockingPeriod)`]

- [`PricerDisputePeriodUpdated(address pricer, uint256 disputePeriod)`]

- [`ExpiryPriceUpdated(address asset, uint256 expirtyTimestamp, uint256 price, uint256 onchainTimestamp)`]

- [`ExpiryPriceDisputed(address asset, uint256 expiryTimestamp, uint256 disputedPrice, uint256 newPrice, uint256 disputeTimestamp)`]

# Function `getPrice(address _asset) → uint256`

No description

## Parameters:

- `_asset`: the asset address

## Return Values:

- price scaled in 1e18, denominated in USD

e.g. 173689000000000000000 => 175.689 USD

# Function `getExpiryPrice(address _asset, uint256 _expiryTimestamp) → uint256, bool`

No description

## Parameters:

- `_asset`: the asset want to get price at.

- `_expiryTimestamp`: expiry timestamp

## Return Values:

- price denominated in USD, scaled 10e18

- isFinalized if the price is finalized or not.

# Function `getPricer(address _asset) → address`

No description

## Parameters:

- `_asset`: get the pricer for a specific asset.

## Return Values:

- pricer address

# Function `getDisputer() → address`

No description

## Return Values:

- pricer address

# Function `getPricerLockingPeriod(address _pricer) → uint256`

during locking period, price can not be submitted to this contract

## Parameters:

- `_pricer`: pricer address

## Return Values:

- locking period

# Function `getPricerDisputePeriod(address _pricer) → uint256`

during dispute period, the owner of this contract can dispute the submitted price and modify it.

The dispute period start after submitting a price on-chain

## Parameters:

- `_pricer`: oracle address

## Return Values:

- dispute period

# Function `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) → bool`

No description

## Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

## Return Values:

- True if locking period is over, otherwise false

# Function `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) → bool`

No description

## Parameters:

- `_asset`: assets to query

- `_expiryTimestamp`: expiry timestamp of otoken

## Return Values:

- True if dispute period is over, otherwise false

# Function `setAssetPricer(address _asset, address _pricer)`

can only be called by owner

## Parameters:

- `_asset`: asset

- `_pricer`: pricer address

# Function `setLockingPeriod(address _pricer, uint256 _lockingPeriod)`

this function can only be called by owner

## Parameters:

- `_pricer`: pricer address

- `_lockingPeriod`: locking period

# Function `setDisputePeriod(address _pricer, uint256 _disputePeriod)`

can only be called by owner

## Parameters:

- `_pricer`: oracle address

- `_disputePeriod`: dispute period

# Function `setDisputer(address _disputer)`

can only be called by owner

## Parameters:

- `_disputer`: oracle address

# Function `disputeExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)`

only owner can dispute a price during the dispute period, by setting a new one.

## Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

- `_price`: the correct price

# Function `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)`

asset price can only be set after locking period is over and before starting dispute period

## Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

- `_price`: the asset price at expiry

# Event `DisputerUpdated(address newDisputer)`

No description

# Event `PricerUpdated(address asset, address pricer)`

No description

# Event `PricerLockingPeriodUpdated(address pricer, uint256 lockingPeriod)`

No description

# Event `PricerDisputePeriodUpdated(address pricer, uint256 disputePeriod)`

No description

# Event `ExpiryPriceUpdated(address asset, uint256 expirtyTimestamp, uint256 price, uint256 onchainTimestamp)`

No description

# Event `ExpiryPriceDisputed(address asset, uint256 expiryTimestamp, uint256 disputedPrice, uint256 newPrice, uint256 disputeTimestamp)`

No description
