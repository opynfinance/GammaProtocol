# `Oracle`

The Oracle module sets, retrieves, and stores USD prices (USD per asset) for underlying, collateral, and strike assets

manages pricers that are used for different assets

## Functions:

- `getPrice(address _asset) (external)`

- `getExpiryPrice(address _asset, uint256 _expiryTimestamp) (external)`

- `getPricer(address _asset) (external)`

- `getDisputer() (external)`

- `getPricerLockingPeriod(address _pricer) (external)`

- `getPricerDisputePeriod(address _pricer) (external)`

- `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) (public)`

- `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) (public)`

- `setAssetPricer(address _asset, address _pricer) (external)`

- `setLockingPeriod(address _pricer, uint256 _lockingPeriod) (external)`

- `setDisputePeriod(address _pricer, uint256 _disputePeriod) (external)`

- `setDisputer(address _disputer) (external)`

- `disputeExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price) (external)`

- `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price) (external)`

## Events:

- `DisputerUpdated(address newDisputer)`

- `PricerUpdated(address asset, address pricer)`

- `PricerLockingPeriodUpdated(address pricer, uint256 lockingPeriod)`

- `PricerDisputePeriodUpdated(address pricer, uint256 disputePeriod)`

- `ExpiryPriceUpdated(address asset, uint256 expiryTimestamp, uint256 price, uint256 onchainTimestamp)`

- `ExpiryPriceDisputed(address asset, uint256 expiryTimestamp, uint256 disputedPrice, uint256 newPrice, uint256 disputeTimestamp)`

### Function `getPrice(address _asset) → uint256 external`

get a live asset price from the asset's pricer contract

#### Parameters:

- `_asset`: asset address

#### Return Values:

- price scaled by 1e8, denominated in USD

e.g. 17368900000 => 175.689 USD

### Function `getExpiryPrice(address _asset, uint256 _expiryTimestamp) → uint256, bool external`

get the asset price at specific expiry timestamp

#### Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

#### Return Values:

- price scaled by 1e8, denominated in USD

- isFinalized True, if the price is finalized, False if not

### Function `getPricer(address _asset) → address external`

get the pricer for an asset

#### Parameters:

- `_asset`: asset address

#### Return Values:

- pricer address

### Function `getDisputer() → address external`

get the disputer address

#### Return Values:

- disputer address

### Function `getPricerLockingPeriod(address _pricer) → uint256 external`

get a pricer's locking period

locking period is the period of time after the expiry timestamp where a price can not be pushed

during the locking period an expiry price can not be submitted to this contract

#### Parameters:

- `_pricer`: pricer address

#### Return Values:

- locking period

### Function `getPricerDisputePeriod(address _pricer) → uint256 external`

get a pricer's dispute period

dispute period is the period of time after an expiry price has been pushed where a price can be disputed

during the dispute period, the disputer can dispute the submitted price and modify it

#### Parameters:

- `_pricer`: pricer address

#### Return Values:

- dispute period

### Function `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) → bool public`

check if the locking period is over for setting the asset price at a particular expiry timestamp

#### Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

#### Return Values:

- True if locking period is over, False if not

### Function `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) → bool public`

check if the dispute period is over

#### Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

#### Return Values:

- True if dispute period is over, False if not

### Function `setAssetPricer(address _asset, address _pricer) external`

sets the pricer for an asset

can only be called by the owner

#### Parameters:

- `_asset`: asset address

- `_pricer`: pricer address

### Function `setLockingPeriod(address _pricer, uint256 _lockingPeriod) external`

sets the locking period for a pricer

can only be called by the owner

#### Parameters:

- `_pricer`: pricer address

- `_lockingPeriod`: locking period

### Function `setDisputePeriod(address _pricer, uint256 _disputePeriod) external`

sets the dispute period for a pricer

can only be called by the owner

for a composite pricer (ie CompoundPricer) that depends on or calls other pricers, ensure

that the dispute period for the composite pricer is longer than the dispute period for the

asset pricer that it calls to ensure safe usage as a dispute in the other pricer will cause

the need for a dispute with the composite pricer's price

#### Parameters:

- `_pricer`: pricer address

- `_disputePeriod`: dispute period

### Function `setDisputer(address _disputer) external`

set the disputer address

can only be called by the owner

#### Parameters:

- `_disputer`: disputer address

### Function `disputeExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price) external`

dispute an asset price during the dispute period

only the owner can dispute a price during the dispute period, by setting a new one

#### Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

- `_price`: the correct price

### Function `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price) external`

submits the expiry price to the oracle, can only be set from the pricer

asset price can only be set after the locking period is over and before the dispute period has started

#### Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

- `_price`: asset price at expiry

### Event `DisputerUpdated(address newDisputer)`

emits an event when the disputer is updated

### Event `PricerUpdated(address asset, address pricer)`

emits an event when the pricer is updated for an asset

### Event `PricerLockingPeriodUpdated(address pricer, uint256 lockingPeriod)`

emits an event when the locking period is updated for a pricer

### Event `PricerDisputePeriodUpdated(address pricer, uint256 disputePeriod)`

emits an event when the dispute period is updated for a pricer

### Event `ExpiryPriceUpdated(address asset, uint256 expiryTimestamp, uint256 price, uint256 onchainTimestamp)`

emits an event when an expiry price is updated for a specific asset

### Event `ExpiryPriceDisputed(address asset, uint256 expiryTimestamp, uint256 disputedPrice, uint256 newPrice, uint256 disputeTimestamp)`

emits an event when the disputer disputes a price during the dispute period
