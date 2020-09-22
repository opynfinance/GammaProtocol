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

# Function `setRealTimePrice(address _asset, uint256 _price)` {#MockOracle-setRealTimePrice-address-uint256-}

No description

# Function `getPrice(address _asset) → uint256` {#MockOracle-getPrice-address-}

No description

# Function `setExpiryPriceFinalizedAllPeiodOver(address _asset, uint256 _expiryTimestamp, uint256 _price, bool _isFinalized)` {#MockOracle-setExpiryPriceFinalizedAllPeiodOver-address-uint256-uint256-bool-}

No description

# Function `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)` {#MockOracle-setExpiryPrice-address-uint256-uint256-}

No description

# Function `setIsFinalized(address _asset, uint256 _expiryTimestamp, bool _isFinalized)` {#MockOracle-setIsFinalized-address-uint256-bool-}

No description

# Function `getExpiryPrice(address _asset, uint256 _expiryTimestamp) → uint256, bool` {#MockOracle-getExpiryPrice-address-uint256-}

No description

# Function `getPricer(address _asset) → address` {#MockOracle-getPricer-address-}

No description

# Function `getPricerLockingPeriod(address _pricer) → uint256` {#MockOracle-getPricerLockingPeriod-address-}

No description

# Function `getPricerDisputePeriod(address _pricer) → uint256` {#MockOracle-getPricerDisputePeriod-address-}

No description

# Function `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) → bool` {#MockOracle-isLockingPeriodOver-address-uint256-}

No description

# Function `setIsLockingPeriodOver(address _asset, uint256 _expiryTimestamp, bool _result)` {#MockOracle-setIsLockingPeriodOver-address-uint256-bool-}

No description

# Function `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) → bool` {#MockOracle-isDisputePeriodOver-address-uint256-}

No description

# Function `setIsDisputePeriodOver(address _asset, uint256 _expiryTimestamp, bool _result)` {#MockOracle-setIsDisputePeriodOver-address-uint256-bool-}

No description

# Function `setAssetPricer(address _asset, address _pricer)` {#MockOracle-setAssetPricer-address-address-}

No description

# Function `setLockingPeriod(address _pricer, uint256 _lockingPeriod)` {#MockOracle-setLockingPeriod-address-uint256-}

No description

# Function `setDisputePeriod(address _pricer, uint256 _disputePeriod)` {#MockOracle-setDisputePeriod-address-uint256-}

No description
