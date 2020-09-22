## `MarginPool`

contract that hold all protocol funds

### `onlyController()`

check if the sender is the Controller module

### `onlyFarmer()`

check if the sender is the farmer address

### `constructor(address _addressBook)` (public)

contructor

### `transferToPool(address _asset, address _user, uint256 _amount)` (public)

transfers asset from user to pool

all tokens are scaled to have 1e18 precision in contracts, but are scaled to native

token decimals in Controller before being passed to MarginPool

### `transferToUser(address _asset, address payable _user, uint256 _amount)` (public)

transfers asset from pool to user

all tokens are scaled to have 1e18 precision in contracts, but are scaled to native

token decimals in Controller before being passed to MarginPool

### `getStoredBalance(address _asset) → uint256` (external)

get asset stored balance

### `batchTransferToPool(address[] _asset, address[] _user, uint256[] _amount)` (external)

transfers multiple assets from users to pool

all tokens are scaled to have 1e18 precision in contracts, but are scaled to native

token decimals in Controller before being passed to MarginPool

### `batchTransferToUser(address[] _asset, address payable[] _user, uint256[] _amount)` (external)

transfers multiple assets from pool to users

all tokens are scaled to have 1e18 precision in contracts, but are scaled to native

token decimals in Controller before being passed to MarginPool

### `farm(address _asset, address _receiver, uint256 _amount)` (external)

function to collect excess balance

can only be called by farmer address

### `setFarmer(address _farmer)` (external)

function to set farmer address

can only be called by MarginPool owner

### `FarmerUpdated(address oldAddress, address newAddress)`

emit event after updating the farmer address

### `AssetFarmed(address asset, address receiver, uint256 _amount)`

emit event when an asset get harvested
