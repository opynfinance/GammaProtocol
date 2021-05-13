# `MarginPool`

Contract that holds all protocol funds

## Modifiers:

- `onlyController()`

- `onlyFarmer()`

## Functions:

- `constructor(address _addressBook) (public)`

- `transferToPool(address _asset, address _user, uint256 _amount) (public)`

- `transferToUser(address _asset, address _user, uint256 _amount) (public)`

- `getStoredBalance(address _asset) (external)`

- `batchTransferToPool(address[] _asset, address[] _user, uint256[] _amount) (external)`

- `batchTransferToUser(address[] _asset, address[] _user, uint256[] _amount) (external)`

- `farm(address _asset, address _receiver, uint256 _amount) (external)`

- `setFarmer(address _farmer) (external)`

## Events:

- `TransferToPool(address asset, address user, uint256 amount)`

- `TransferToUser(address asset, address user, uint256 amount)`

- `FarmerUpdated(address oldAddress, address newAddress)`

- `AssetFarmed(address asset, address receiver, uint256 amount)`

### Modifier `onlyController()`

check if the sender is the Controller module

### Modifier `onlyFarmer()`

check if the sender is the farmer address

### Function `constructor(address _addressBook) public`

contructor

#### Parameters:

- `_addressBook`: AddressBook module

### Function `transferToPool(address _asset, address _user, uint256 _amount) public`

transfers an asset from a user to the pool

#### Parameters:

- `_asset`: address of the asset to transfer

- `_user`: address of the user to transfer assets from

- `_amount`: amount of the token to transfer from _user

### Function `transferToUser(address _asset, address _user, uint256 _amount) public`

transfers an asset from the pool to a user

#### Parameters:

- `_asset`: address of the asset to transfer

- `_user`: address of the user to transfer assets to

- `_amount`: amount of the token to transfer to _user

### Function `getStoredBalance(address _asset) → uint256 external`

get the stored balance of an asset

#### Parameters:

- `_asset`: asset address

#### Return Values:

- asset balance

### Function `batchTransferToPool(address[] _asset, address[] _user, uint256[] _amount) external`

transfers multiple assets from users to the pool

#### Parameters:

- `_asset`: addresses of the assets to transfer

- `_user`: addresses of the users to transfer assets to

- `_amount`: amount of each token to transfer to pool

### Function `batchTransferToUser(address[] _asset, address[] _user, uint256[] _amount) external`

transfers multiple assets from the pool to users

#### Parameters:

- `_asset`: addresses of the assets to transfer

- `_user`: addresses of the users to transfer assets to

- `_amount`: amount of each token to transfer to _user

### Function `farm(address _asset, address _receiver, uint256 _amount) external`

function to collect the excess balance of a particular asset

can only be called by the farmer address. Do not farm otokens.

#### Parameters:

- `_asset`: asset address

- `_receiver`: receiver address

- `_amount`: amount to remove from pool

### Function `setFarmer(address _farmer) external`

function to set farmer address

can only be called by MarginPool owner

#### Parameters:

- `_farmer`: farmer address

### Event `TransferToPool(address asset, address user, uint256 amount)`

emits an event when marginpool receive funds from controller

### Event `TransferToUser(address asset, address user, uint256 amount)`

emits an event when marginpool transfer funds to controller

### Event `FarmerUpdated(address oldAddress, address newAddress)`

emit event after updating the farmer address

### Event `AssetFarmed(address asset, address receiver, uint256 amount)`

emit event when an asset gets harvested from the pool
