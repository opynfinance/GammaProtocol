# Functions:

- [`constructor(address _addressBook)`]

- [`transferToPool(address _asset, address _user, uint256 _amount)`]

- [`transferToUser(address _asset, address payable _user, uint256 _amount)`]

- [`getStoredBalance(address _asset)`]

- [`batchTransferToPool(address[] _asset, address[] _user, uint256[] _amount)`]

- [`batchTransferToUser(address[] _asset, address payable[] _user, uint256[] _amount)`]

- [`farm(address _asset, address _receiver, uint256 _amount)`]

- [`setFarmer(address _farmer)`]

# Events:

- [`FarmerUpdated(address oldAddress, address newAddress)`]

- [`AssetFarmed(address asset, address receiver, uint256 _amount)`]

# Function `constructor(address _addressBook)`

No description

## Parameters:

- `_addressBook`: adressbook module

# Function `transferToPool(address _asset, address _user, uint256 _amount)`

all tokens are scaled to have 1e18 precision in contracts, but are scaled to native

token decimals in Controller before being passed to MarginPool

## Parameters:

- `_asset`: address of asset to transfer

- `_user`: address of user to transfer assets from

- `_amount`: amount of token to transfer from _user, scaled to 1e18 of precision

# Function `transferToUser(address _asset, address payable _user, uint256 _amount)`

all tokens are scaled to have 1e18 precision in contracts, but are scaled to native

token decimals in Controller before being passed to MarginPool

## Parameters:

- `_asset`: address of asset to transfer

- `_user`: address of user to transfer assets to

- `_amount`: amount of token to transfer to _user, scaled to 1e18 of precision

# Function `getStoredBalance(address _asset) → uint256`

No description

## Parameters:

- `_asset`: asset address

## Return Values:

- asset balance

# Function `batchTransferToPool(address[] _asset, address[] _user, uint256[] _amount)`

all tokens are scaled to have 1e18 precision in contracts, but are scaled to native

token decimals in Controller before being passed to MarginPool

## Parameters:

- `_asset`: addresses of assets to transfer

- `_user`: addresses of users to transfer assets to

- `_amount`: amount of each token to transfer to _user, scaled to 1e18 of precision

# Function `batchTransferToUser(address[] _asset, address payable[] _user, uint256[] _amount)`

all tokens are scaled to have 1e18 precision in contracts, but are scaled to native

token decimals in Controller before being passed to MarginPool

## Parameters:

- `_asset`: addresses of assets to transfer

- `_user`: addresses of users to transfer assets to

- `_amount`: amount of each token to transfer to _user, scaled to 1e18 of precision

# Function `farm(address _asset, address _receiver, uint256 _amount)`

can only be called by farmer address

## Parameters:

- `_asset`: asset address

- `_receiver`: receiver address

- `_amount`: amount to harvest

# Function `setFarmer(address _farmer)`

can only be called by MarginPool owner

## Parameters:

- `_farmer`: farmer address

# Event `FarmerUpdated(address oldAddress, address newAddress)`

No description

# Event `AssetFarmed(address asset, address receiver, uint256 _amount)`

No description
