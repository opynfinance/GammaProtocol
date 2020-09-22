This contract combines an upgradeability proxy with basic authorization control functionalities

# Functions:

- [`constructor()`]

- [`proxyOwner()`]

- [`transferProxyOwnership(address _newOwner)`]

- [`upgradeTo(address _implementation)`]

- [`upgradeToAndCall(address _implementation, bytes _data)`]

# Events:

- [`ProxyOwnershipTransferred(address previousOwner, address newOwner)`]

# Function `constructor()`

the constructor sets the original owner of the contract to the sender account.

# Function `proxyOwner() → address owner`

Tells the address of the owner

## Return Values:

- owner the address of the owner

# Function `transferProxyOwnership(address _newOwner)`

Allows the current owner to transfer control of the contract to a newOwner.

## Parameters:

- `_newOwner`: The address to transfer ownership to.

# Function `upgradeTo(address _implementation)`

Allows the proxy owner to upgrade the current version of the proxy.

## Parameters:

- `_implementation`: representing the address of the new implementation to be set.

# Function `upgradeToAndCall(address _implementation, bytes _data)`

Allows the proxy owner to upgrade the current version of the proxy and call the new implementation

to initialize whatever is needed through a low level call.

## Parameters:

- `_implementation`: representing the address of the new implementation to be set.

- `_data`: represents the msg.data to bet sent in the low level call. This parameter may include the function

signature of the implementation to be called with the needed payload

# Event `ProxyOwnershipTransferred(address previousOwner, address newOwner)`

Event to show ownership has been transferred

## Parameters:

- `previousOwner`: representing the address of the previous owner

- `newOwner`: representing the address of the new owner
