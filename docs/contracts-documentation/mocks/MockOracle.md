## `MockOracle`

SPDX-License-Identifier: UNLICENSED

The MockOracle contract let us easily manipulate the oracle state in testings.

# Functions:

- `setRealTimePrice(address _asset, uint256 _price) (external)`

- `getPrice(address _asset) (external)`

- `setExpiryPriceFinalizedAllPeiodOver(address _asset, uint256 _expiryTimestamp, uint256 _price, bool _isFinalized) (external)`

- `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price) (external)`

- `setIsFinalized(address _asset, uint256 _expiryTimestamp, bool _isFinalized) (external)`

- `getExpiryPrice(address _asset, uint256 _expiryTimestamp) (external)`

- `getPricer(address _asset) (external)`

- `getPricerLockingPeriod(address _pricer) (external)`

- `getPricerDisputePeriod(address _pricer) (external)`

- `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) (public)`

- `setIsLockingPeriodOver(address _asset, uint256 _expiryTimestamp, bool _result) (external)`

- `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) (external)`

- `setIsDisputePeriodOver(address _asset, uint256 _expiryTimestamp, bool _result) (external)`

- `setAssetPricer(address _asset, address _pricer) (external)`

- `setLockingPeriod(address _pricer, uint256 _lockingPeriod) (external)`

- `setDisputePeriod(address _pricer, uint256 _disputePeriod) (external)`

# Function `setRealTimePrice(address _asset, uint256 _price)` (external)

# Function `getPrice(address _asset) → uint256` (external)

# Function `setExpiryPriceFinalizedAllPeiodOver(address _asset, uint256 _expiryTimestamp, uint256 _price, bool _isFinalized)` (external)

# Function `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)` (external)

# Function `setIsFinalized(address _asset, uint256 _expiryTimestamp, bool _isFinalized)` (external)

# Function `getExpiryPrice(address _asset, uint256 _expiryTimestamp) → uint256, bool` (external)

# Function `getPricer(address _asset) → address` (external)

# Function `getPricerLockingPeriod(address _pricer) → uint256` (external)

# Function `getPricerDisputePeriod(address _pricer) → uint256` (external)

# Function `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) → bool` (public)

# Function `setIsLockingPeriodOver(address _asset, uint256 _expiryTimestamp, bool _result)` (external)

# Function `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) → bool` (external)

# Function `setIsDisputePeriodOver(address _asset, uint256 _expiryTimestamp, bool _result)` (external)

# Function `setAssetPricer(address _asset, address _pricer)` (external)

# Function `setLockingPeriod(address _pricer, uint256 _lockingPeriod)` (external)

# Function `setDisputePeriod(address _pricer, uint256 _disputePeriod)` (external)
