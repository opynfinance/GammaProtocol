## `Oracle`

The Oracle module provide the system with on-chain prices

### `getPrice(address _asset) → uint256` (external)

get the live price from oracle

### `getExpiryPrice(address _asset, uint256 _expiryTimestamp) → uint256, bool` (external)

get the asset price at specific expiry timestamp.

### `getPricer(address _asset) → address` (external)

get asset pricer

### `getDisputer() → address` (external)

get disputer address

### `getPricerLockingPeriod(address _pricer) → uint256` (external)

get pricer locking period. A locking period is a period of time after expiry where no one can push price to oracle

during locking period, price can not be submitted to this contract

### `getPricerDisputePeriod(address _pricer) → uint256` (external)

get pricer dispute period

during dispute period, the owner of this contract can dispute the submitted price and modify it.

The dispute period start after submitting a price on-chain

### `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) → bool` (public)

check if locking period is over for setting the asset price for that timestamp

### `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) → bool` (public)

check if dispute period is over

### `setAssetPricer(address _asset, address _pricer)` (external)

set pricer for an asset

can only be called by owner

### `setLockingPeriod(address _pricer, uint256 _lockingPeriod)` (external)

set pricer locking period

this function can only be called by owner

### `setDisputePeriod(address _pricer, uint256 _disputePeriod)` (external)

set oracle dispute period

can only be called by owner

### `setDisputer(address _disputer)` (external)

set the disputer role

can only be called by owner

### `disputeExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)` (external)

dispute an asset price by owner during dispute period

only owner can dispute a price during the dispute period, by setting a new one.

### `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)` (external)

submit expiry price to the oracle, can only be set from the pricer.

asset price can only be set after locking period is over and before starting dispute period

### `DisputerUpdated(address newDisputer)`

emits an event when disputer is updated

### `PricerUpdated(address asset, address pricer)`

emits an event when an pricer updated for a specific asset

### `PricerLockingPeriodUpdated(address pricer, uint256 lockingPeriod)`

emits an event when a locking period updated for a specific oracle

### `PricerDisputePeriodUpdated(address pricer, uint256 disputePeriod)`

emits an event when a dispute period updated for a specific oracle

### `ExpiryPriceUpdated(address asset, uint256 expirtyTimestamp, uint256 price, uint256 onchainTimestamp)`

emits an event when price is updated for a specific asset

### `ExpiryPriceDisputed(address asset, uint256 expiryTimestamp, uint256 disputedPrice, uint256 newPrice, uint256 disputeTimestamp)`

emits an event when owner dispute a asset price during dispute period
