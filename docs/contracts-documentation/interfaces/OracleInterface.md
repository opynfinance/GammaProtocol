# `OracleInterface`

## Functions:

- `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) (external)`

- `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) (external)`

- `getExpiryPrice(address _asset, uint256 _expiryTimestamp) (external)`

- `getDisputer() (external)`

- `getPricer(address _asset) (external)`

- `getPrice(address _asset) (external)`

- `getPricerLockingPeriod(address _pricer) (external)`

- `getPricerDisputePeriod(address _pricer) (external)`

- `getChainlinkRoundData(address _asset, uint80 _roundId) (external)`

- `setAssetPricer(address _asset, address _pricer) (external)`

- `setLockingPeriod(address _pricer, uint256 _lockingPeriod) (external)`

- `setDisputePeriod(address _pricer, uint256 _disputePeriod) (external)`

- `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price) (external)`

- `disputeExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price) (external)`

- `setDisputer(address _disputer) (external)`

### Function `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) → bool external`

### Function `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) → bool external`

### Function `getExpiryPrice(address _asset, uint256 _expiryTimestamp) → uint256, bool external`

### Function `getDisputer() → address external`

### Function `getPricer(address _asset) → address external`

### Function `getPrice(address _asset) → uint256 external`

### Function `getPricerLockingPeriod(address _pricer) → uint256 external`

### Function `getPricerDisputePeriod(address _pricer) → uint256 external`

### Function `getChainlinkRoundData(address _asset, uint80 _roundId) → uint256, uint256 external`

### Function `setAssetPricer(address _asset, address _pricer) external`

### Function `setLockingPeriod(address _pricer, uint256 _lockingPeriod) external`

### Function `setDisputePeriod(address _pricer, uint256 _disputePeriod) external`

### Function `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price) external`

### Function `disputeExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price) external`

### Function `setDisputer(address _disputer) external`
