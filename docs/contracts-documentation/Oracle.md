# `Oracle`

The Oracle module provide the system with on-chain prices

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

- `ExpiryPriceUpdated(address asset, uint256 expirtyTimestamp, uint256 price, uint256 onchainTimestamp)`

- `ExpiryPriceDisputed(address asset, uint256 expiryTimestamp, uint256 disputedPrice, uint256 newPrice, uint256 disputeTimestamp)`

### Function `getPrice(address _asset) → uint256 external`

get the live price from oracle

#### Parameters:

- `_asset`: the asset address

#### Return Values:

- price scaled in 1e18, denominated in USD

e.g. 173689000000000000000 => 175.689 USD

### Function `getExpiryPrice(address _asset, uint256 _expiryTimestamp) → uint256, bool external`

get the asset price at specific expiry timestamp.

#### Parameters:

- `_asset`: the asset want to get price at.

- `_expiryTimestamp`: expiry timestamp

#### Return Values:

- price denominated in USD, scaled 10e18

- isFinalized if the price is finalized or not.

### Function `getPricer(address _asset) → address external`

get asset pricer

#### Parameters:

- `_asset`: get the pricer for a specific asset.

#### Return Values:

- pricer address

### Function `getDisputer() → address external`

get disputer address

#### Return Values:

- pricer address

### Function `getPricerLockingPeriod(address _pricer) → uint256 external`

get pricer locking period. A locking period is a period of time after expiry where no one can push price to oracle

during locking period, price can not be submitted to this contract

#### Parameters:

- `_pricer`: pricer address

#### Return Values:

- locking period

### Function `getPricerDisputePeriod(address _pricer) → uint256 external`

get pricer dispute period

during dispute period, the owner of this contract can dispute the submitted price and modify it.

The dispute period start after submitting a price on-chain

#### Parameters:

- `_pricer`: oracle address

#### Return Values:

- dispute period

### Function `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) → bool public`

check if locking period is over for setting the asset price for that timestamp

#### Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

#### Return Values:

- True if locking period is over, otherwise false

### Function `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) → bool public`

check if dispute period is over

#### Parameters:

- `_asset`: assets to query

- `_expiryTimestamp`: expiry timestamp of otoken

#### Return Values:

- True if dispute period is over, otherwise false

### Function `setAssetPricer(address _asset, address _pricer) external`

set pricer for an asset

can only be called by owner

#### Parameters:

- `_asset`: asset

- `_pricer`: pricer address

### Function `setLockingPeriod(address _pricer, uint256 _lockingPeriod) external`

set pricer locking period

this function can only be called by owner

#### Parameters:

- `_pricer`: pricer address

- `_lockingPeriod`: locking period

### Function `setDisputePeriod(address _pricer, uint256 _disputePeriod) external`

set oracle dispute period

can only be called by owner

#### Parameters:

- `_pricer`: oracle address

- `_disputePeriod`: dispute period

### Function `setDisputer(address _disputer) external`

set the disputer role

can only be called by owner

#### Parameters:

- `_disputer`: oracle address

### Function `disputeExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price) external`

dispute an asset price by owner during dispute period

only owner can dispute a price during the dispute period, by setting a new one.

#### Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

- `_price`: the correct price

### Function `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price) external`

submit expiry price to the oracle, can only be set from the pricer.

asset price can only be set after locking period is over and before starting dispute period

#### Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

- `_price`: the asset price at expiry

### Event `DisputerUpdated(address newDisputer)`

emits an event when disputer is updated

### Event `PricerUpdated(address asset, address pricer)`

emits an event when an pricer updated for a specific asset

### Event `PricerLockingPeriodUpdated(address pricer, uint256 lockingPeriod)`

emits an event when a locking period updated for a specific oracle

### Event `PricerDisputePeriodUpdated(address pricer, uint256 disputePeriod)`

emits an event when a dispute period updated for a specific oracle

### Event `ExpiryPriceUpdated(address asset, uint256 expirtyTimestamp, uint256 price, uint256 onchainTimestamp)`

emits an event when price is updated for a specific asset

### Event `ExpiryPriceDisputed(address asset, uint256 expiryTimestamp, uint256 disputedPrice, uint256 newPrice, uint256 disputeTimestamp)`

emits an event when owner dispute a asset price during dispute period
