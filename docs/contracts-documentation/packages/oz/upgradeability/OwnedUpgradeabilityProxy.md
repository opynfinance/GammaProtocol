# `OwnedUpgradeabilityProxy`

This contract combines an upgradeability proxy with basic authorization control functionalities

## Modifiers:

- `onlyProxyOwner()`

## Functions:

- `constructor() (public)`

- `proxyOwner() (public)`

- `setUpgradeabilityOwner(address _newProxyOwner) (internal)`

- `transferProxyOwnership(address _newOwner) (public)`

- `upgradeTo(address _implementation) (public)`

- `upgradeToAndCall(address _implementation, bytes _data) (public)`

## Events:

- `ProxyOwnershipTransferred(address previousOwner, address newOwner)`

### Modifier `onlyProxyOwner()`

Throws if called by any account other than the owner.

### Function `constructor() public`

the constructor sets the original owner of the contract to the sender account.

### Function `proxyOwner() → address owner public`

Tells the address of the owner

#### Return Values:

- owner the address of the owner

### Function `setUpgradeabilityOwner(address _newProxyOwner) internal`

Sets the address of the owner

#### Parameters:

- `_newProxyOwner`: address of new proxy owner

### Function `transferProxyOwnership(address _newOwner) public`

Allows the current owner to transfer control of the contract to a newOwner.

#### Parameters:

- `_newOwner`: The address to transfer ownership to.

### Function `upgradeTo(address _implementation) public`

Allows the proxy owner to upgrade the current version of the proxy.

#### Parameters:

- `_implementation`: representing the address of the new implementation to be set.

### Function `upgradeToAndCall(address _implementation, bytes _data) public`

Allows the proxy owner to upgrade the current version of the proxy and call the new implementation

to initialize whatever is needed through a low level call.

#### Parameters:

- `_implementation`: representing the address of the new implementation to be set.

- `_data`: represents the msg.data to bet sent in the low level call. This parameter may include the function

signature of the implementation to be called with the needed payload

### Event `ProxyOwnershipTransferred(address previousOwner, address newOwner)`

Event to show ownership has been transferred

#### Parameters:

- `previousOwner`: representing the address of the previous owner

- `newOwner`: representing the address of the new owner
