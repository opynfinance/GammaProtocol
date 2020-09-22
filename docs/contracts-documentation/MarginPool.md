## `MarginPool`

contract that hold all protocol funds

# Modifiers:

- `onlyController()`

- `onlyFarmer()`

# Functions:

- `constructor(address _addressBook) (public)`

- `transferToPool(address _asset, address _user, uint256 _amount) (public)`

- `transferToUser(address _asset, address payable _user, uint256 _amount) (public)`

- `getStoredBalance(address _asset) (external)`

- `batchTransferToPool(address[] _asset, address[] _user, uint256[] _amount) (external)`

- `batchTransferToUser(address[] _asset, address payable[] _user, uint256[] _amount) (external)`

- `farm(address _asset, address _receiver, uint256 _amount) (external)`

- `setFarmer(address _farmer) (external)`

# Events:

- `FarmerUpdated(address oldAddress, address newAddress)`

- `AssetFarmed(address asset, address receiver, uint256 _amount)`

# Modifier `onlyController()`

check if the sender is the Controller module

# Modifier `onlyFarmer()`

check if the sender is the farmer address

# Function `constructor(address _addressBook)` (public)

contructor

## Parameters:

- `_addressBook`: adressbook module

# Function `transferToPool(address _asset, address _user, uint256 _amount)` (public)

transfers asset from user to pool

all tokens are scaled to have 1e18 precision in contracts, but are scaled to native

token decimals in Controller before being passed to MarginPool

## Parameters:

- `_asset`: address of asset to transfer

- `_user`: address of user to transfer assets from

- `_amount`: amount of token to transfer from _user, scaled to 1e18 of precision

# Function `transferToUser(address _asset, address payable _user, uint256 _amount)` (public)

transfers asset from pool to user

all tokens are scaled to have 1e18 precision in contracts, but are scaled to native

token decimals in Controller before being passed to MarginPool

## Parameters:

- `_asset`: address of asset to transfer

- `_user`: address of user to transfer assets to

- `_amount`: amount of token to transfer to _user, scaled to 1e18 of precision

# Function `getStoredBalance(address _asset) → uint256` (external)

get asset stored balance

## Parameters:

- `_asset`: asset address

## Return Values:

- asset balance

# Function `batchTransferToPool(address[] _asset, address[] _user, uint256[] _amount)` (external)

transfers multiple assets from users to pool

all tokens are scaled to have 1e18 precision in contracts, but are scaled to native

token decimals in Controller before being passed to MarginPool

## Parameters:

- `_asset`: addresses of assets to transfer

- `_user`: addresses of users to transfer assets to

- `_amount`: amount of each token to transfer to _user, scaled to 1e18 of precision

# Function `batchTransferToUser(address[] _asset, address payable[] _user, uint256[] _amount)` (external)

transfers multiple assets from pool to users

all tokens are scaled to have 1e18 precision in contracts, but are scaled to native

token decimals in Controller before being passed to MarginPool

## Parameters:

- `_asset`: addresses of assets to transfer

- `_user`: addresses of users to transfer assets to

- `_amount`: amount of each token to transfer to _user, scaled to 1e18 of precision

# Function `farm(address _asset, address _receiver, uint256 _amount)` (external)

function to collect excess balance

can only be called by farmer address

## Parameters:

- `_asset`: asset address

- `_receiver`: receiver address

- `_amount`: amount to harvest

# Function `setFarmer(address _farmer)` (external)

function to set farmer address

can only be called by MarginPool owner

## Parameters:

- `_farmer`: farmer address

# Event `FarmerUpdated(address oldAddress, address newAddress)`

emit event after updating the farmer address

# Event `AssetFarmed(address asset, address receiver, uint256 _amount)`

emit event when an asset get harvested
