## `AddressBook`

### `getOtokenImpl() → address` (external)

return otoken implementation address

### `getOtokenFactory() → address` (external)

return otoken factory address

### `getWhitelist() → address` (external)

return whitelist address

### `getController() → address` (external)

return controller address

### `getMarginPool() → address` (external)

return pool address

### `getMarginCalculator() → address` (external)

return margin calculator address

### `getLiquidationManager() → address` (external)

return liquidation manager address

### `getOracle() → address` (external)

return oracle address

### `setOtokenImpl(address _otokenImpl)` (external)

set otoken implementation address

can only be called by addressbook owner

### `setOtokenFactory(address _otokenFactory)` (external)

set otoken factory address

can only be called by addressbook owner

### `setWhitelist(address _whitelist)` (external)

set whitelist address

can only be called by addressbook owner

### `setController(address _controller)` (external)

set controller address

can only be called by addressbook owner

### `setMarginPool(address _marginPool)` (external)

set pool address

can only be called by addressbook owner

### `setMarginCalculator(address _marginCalculator)` (external)

set margin calculator address

can only be called by addressbook owner

### `setLiquidationManager(address _liquidationManager)` (external)

set liquidation manager address

can only be called by addressbook owner

### `setOracle(address _oracle)` (external)

set oracle address

can only be called by addressbook owner

### `getAddress(bytes32 _key) → address` (public)

return an address for specific key

### `setAddress(bytes32 _key, address _address)` (public)

set a specific address for a specific key

can only be called by addressbook owner

### `updateImpl(bytes32 _id, address _newAddress)` (public)

internal function to update the implementation of a specific component of the protocol

### `ProxyCreated(bytes32 id, address proxy)`

event emitted when a new proxy get created

### `AddressAdded(bytes32 id, address add)`

event emitted when a new address get added
