## `MockOracle`

SPDX-License-Identifier: UNLICENSED

The MockOracle contract let us easily manipulate the oracle state in testings.

### `setRealTimePrice(address _asset, uint256 _price)` (external)

### `getPrice(address _asset) → uint256` (external)

### `setExpiryPriceFinalizedAllPeiodOver(address _asset, uint256 _expiryTimestamp, uint256 _price, bool _isFinalized)` (external)

### `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)` (external)

### `setIsFinalized(address _asset, uint256 _expiryTimestamp, bool _isFinalized)` (external)

### `getExpiryPrice(address _asset, uint256 _expiryTimestamp) → uint256, bool` (external)

### `getPricer(address _asset) → address` (external)

### `getPricerLockingPeriod(address _pricer) → uint256` (external)

### `getPricerDisputePeriod(address _pricer) → uint256` (external)

### `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) → bool` (public)

### `setIsLockingPeriodOver(address _asset, uint256 _expiryTimestamp, bool _result)` (external)

### `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) → bool` (external)

### `setIsDisputePeriodOver(address _asset, uint256 _expiryTimestamp, bool _result)` (external)

### `setAssetPricer(address _asset, address _pricer)` (external)

### `setLockingPeriod(address _pricer, uint256 _lockingPeriod)` (external)

### `setDisputePeriod(address _pricer, uint256 _disputePeriod)` (external)
