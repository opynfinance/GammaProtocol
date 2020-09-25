# `UpgradeabilityProxy`

This contract represents a proxy where the implementation address to which it will delegate can be upgraded

## Functions:

- `implementation() (public)`

- `setImplementation(address _newImplementation) (internal)`

- `_upgradeTo(address _newImplementation) (internal)`

## Events:

- `Upgraded(address implementation)`

### Function `implementation() → address impl public`

Tells the address of the current implementation

#### Return Values:

- impl address of the current implementation

### Function `setImplementation(address _newImplementation) internal`

Sets the address of the current implementation

#### Parameters:

- `_newImplementation`: address representing the new implementation to be set

### Function `_upgradeTo(address _newImplementation) internal`

Upgrades the implementation address

#### Parameters:

- `_newImplementation`: representing the address of the new implementation to be set

### Event `Upgraded(address implementation)`

This event will be emitted every time the implementation gets upgraded

#### Parameters:

- `implementation`: representing the address of the upgraded implementation
