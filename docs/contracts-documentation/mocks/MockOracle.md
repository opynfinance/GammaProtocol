The MockOracle contract let us easily manipulate the oracle state in testings.

# Functions:

- [`setRealTimePrice(address _asset, uint256 _price)`](#MockOracle-setRealTimePrice-address-uint256-)

- [`getPrice(address _asset)`](#MockOracle-getPrice-address-)

- [`setExpiryPriceFinalizedAllPeiodOver(address _asset, uint256 _expiryTimestamp, uint256 _price, bool _isFinalized)`](#MockOracle-setExpiryPriceFinalizedAllPeiodOver-address-uint256-uint256-bool-)

- [`setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)`](#MockOracle-setExpiryPrice-address-uint256-uint256-)

- [`setIsFinalized(address _asset, uint256 _expiryTimestamp, bool _isFinalized)`](#MockOracle-setIsFinalized-address-uint256-bool-)

- [`getExpiryPrice(address _asset, uint256 _expiryTimestamp)`](#MockOracle-getExpiryPrice-address-uint256-)

- [`getPricer(address _asset)`](#MockOracle-getPricer-address-)

- [`getPricerLockingPeriod(address _pricer)`](#MockOracle-getPricerLockingPeriod-address-)

- [`getPricerDisputePeriod(address _pricer)`](#MockOracle-getPricerDisputePeriod-address-)

- [`isLockingPeriodOver(address _asset, uint256 _expiryTimestamp)`](#MockOracle-isLockingPeriodOver-address-uint256-)

- [`setIsLockingPeriodOver(address _asset, uint256 _expiryTimestamp, bool _result)`](#MockOracle-setIsLockingPeriodOver-address-uint256-bool-)

- [`isDisputePeriodOver(address _asset, uint256 _expiryTimestamp)`](#MockOracle-isDisputePeriodOver-address-uint256-)

- [`setIsDisputePeriodOver(address _asset, uint256 _expiryTimestamp, bool _result)`](#MockOracle-setIsDisputePeriodOver-address-uint256-bool-)

- [`setAssetPricer(address _asset, address _pricer)`](#MockOracle-setAssetPricer-address-address-)

- [`setLockingPeriod(address _pricer, uint256 _lockingPeriod)`](#MockOracle-setLockingPeriod-address-uint256-)

- [`setDisputePeriod(address _pricer, uint256 _disputePeriod)`](#MockOracle-setDisputePeriod-address-uint256-)

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
