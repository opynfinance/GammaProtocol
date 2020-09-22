## `OwnedUpgradeabilityProxy`

This contract combines an upgradeability proxy with basic authorization control functionalities

### `onlyProxyOwner()`

Throws if called by any account other than the owner.

### `constructor()` (public)

the constructor sets the original owner of the contract to the sender account.

### `proxyOwner() → address owner` (public)

Tells the address of the owner

### `setUpgradeabilityOwner(address _newProxyOwner)` (internal)

Sets the address of the owner

### `transferProxyOwnership(address _newOwner)` (public)

Allows the current owner to transfer control of the contract to a newOwner.

### `upgradeTo(address _implementation)` (public)

Allows the proxy owner to upgrade the current version of the proxy.

### `upgradeToAndCall(address _implementation, bytes _data)` (public)

Allows the proxy owner to upgrade the current version of the proxy and call the new implementation

to initialize whatever is needed through a low level call.

### `ProxyOwnershipTransferred(address previousOwner, address newOwner)`

Event to show ownership has been transferred
