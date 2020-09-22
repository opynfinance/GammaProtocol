The MockOracle contract let us easily manipulate the oracle state in testings.

# Functions:

- [`setRealTimePrice(address _asset, uint256 _price)`]

- [`getPrice(address _asset)`]

- [`setExpiryPriceFinalizedAllPeiodOver(address _asset, uint256 _expiryTimestamp, uint256 _price, bool _isFinalized)`]

- [`setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)`]

- [`setIsFinalized(address _asset, uint256 _expiryTimestamp, bool _isFinalized)`]

- [`getExpiryPrice(address _asset, uint256 _expiryTimestamp)`]

- [`getPricer(address _asset)`]

- [`getPricerLockingPeriod(address _pricer)`]

- [`getPricerDisputePeriod(address _pricer)`]

- [`isLockingPeriodOver(address _asset, uint256 _expiryTimestamp)`]

- [`setIsLockingPeriodOver(address _asset, uint256 _expiryTimestamp, bool _result)`]

- [`isDisputePeriodOver(address _asset, uint256 _expiryTimestamp)`]

- [`setIsDisputePeriodOver(address _asset, uint256 _expiryTimestamp, bool _result)`]

- [`setAssetPricer(address _asset, address _pricer)`]

- [`setLockingPeriod(address _pricer, uint256 _lockingPeriod)`]

- [`setDisputePeriod(address _pricer, uint256 _disputePeriod)`]

# Function `setRealTimePrice(address _asset, uint256 _price)`

No description

# Function `getPrice(address _asset) → uint256`

No description

# Function `setExpiryPriceFinalizedAllPeiodOver(address _asset, uint256 _expiryTimestamp, uint256 _price, bool _isFinalized)`

No description

# Function `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)`

No description

# Function `setIsFinalized(address _asset, uint256 _expiryTimestamp, bool _isFinalized)`

No description

# Function `getExpiryPrice(address _asset, uint256 _expiryTimestamp) → uint256, bool`

No description

# Function `getPricer(address _asset) → address`

No description

# Function `getPricerLockingPeriod(address _pricer) → uint256`

No description

# Function `getPricerDisputePeriod(address _pricer) → uint256`

No description

# Function `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) → bool`

No description

# Function `setIsLockingPeriodOver(address _asset, uint256 _expiryTimestamp, bool _result)`

No description

# Function `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) → bool`

No description

# Function `setIsDisputePeriodOver(address _asset, uint256 _expiryTimestamp, bool _result)`

No description

# Function `setAssetPricer(address _asset, address _pricer)`

No description

# Function `setLockingPeriod(address _pricer, uint256 _lockingPeriod)`

No description

# Function `setDisputePeriod(address _pricer, uint256 _disputePeriod)`

No description
