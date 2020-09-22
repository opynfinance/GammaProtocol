## `UpgradeabilityProxy`

This contract represents a proxy where the implementation address to which it will delegate can be upgraded

### `implementation() → address impl` (public)

Tells the address of the current implementation

### `setImplementation(address _newImplementation)` (internal)

Sets the address of the current implementation

### `_upgradeTo(address _newImplementation)` (internal)

Upgrades the implementation address

### `Upgraded(address implementation)`

This event will be emitted every time the implementation gets upgraded
