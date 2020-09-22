# `AddressBook`

## Functions:

- `getOtokenImpl() (external)`

- `getOtokenFactory() (external)`

- `getWhitelist() (external)`

- `getController() (external)`

- `getMarginPool() (external)`

- `getMarginCalculator() (external)`

- `getLiquidationManager() (external)`

- `getOracle() (external)`

- `setOtokenImpl(address _otokenImpl) (external)`

- `setOtokenFactory(address _otokenFactory) (external)`

- `setWhitelist(address _whitelist) (external)`

- `setController(address _controller) (external)`

- `setMarginPool(address _marginPool) (external)`

- `setMarginCalculator(address _marginCalculator) (external)`

- `setLiquidationManager(address _liquidationManager) (external)`

- `setOracle(address _oracle) (external)`

- `getAddress(bytes32 _key) (public)`

- `setAddress(bytes32 _key, address _address) (public)`

- `updateImpl(bytes32 _id, address _newAddress) (public)`

## Events:

- `ProxyCreated(bytes32 id, address proxy)`

- `AddressAdded(bytes32 id, address add)`

### Function `getOtokenImpl() → address` (external)

return otoken implementation address

#### Return Values:

- otoken implementation address

### Function `getOtokenFactory() → address` (external)

return otoken factory address

#### Return Values:

- otoken factory address

### Function `getWhitelist() → address` (external)

return whitelist address

#### Return Values:

- whitelist address

### Function `getController() → address` (external)

return controller address

#### Return Values:

- controller address

### Function `getMarginPool() → address` (external)

return pool address

#### Return Values:

- pool address

### Function `getMarginCalculator() → address` (external)

return margin calculator address

#### Return Values:

- margin calculator address

### Function `getLiquidationManager() → address` (external)

return liquidation manager address

#### Return Values:

- liquidation manager address

### Function `getOracle() → address` (external)

return oracle address

#### Return Values:

- oracle address

### Function `setOtokenImpl(address _otokenImpl)` (external)

set otoken implementation address

can only be called by addressbook owner

#### Parameters:

- `_otokenImpl`: otoken implementation address

### Function `setOtokenFactory(address _otokenFactory)` (external)

set otoken factory address

can only be called by addressbook owner

#### Parameters:

- `_otokenFactory`: otoken factory address

### Function `setWhitelist(address _whitelist)` (external)

set whitelist address

can only be called by addressbook owner

#### Parameters:

- `_whitelist`: whitelist address

### Function `setController(address _controller)` (external)

set controller address

can only be called by addressbook owner

#### Parameters:

- `_controller`: controller address

### Function `setMarginPool(address _marginPool)` (external)

set pool address

can only be called by addressbook owner

#### Parameters:

- `_marginPool`: pool address

### Function `setMarginCalculator(address _marginCalculator)` (external)

set margin calculator address

can only be called by addressbook owner

#### Parameters:

- `_marginCalculator`: margin calculator address

### Function `setLiquidationManager(address _liquidationManager)` (external)

set liquidation manager address

can only be called by addressbook owner

#### Parameters:

- `_liquidationManager`: liquidation manager address

### Function `setOracle(address _oracle)` (external)

set oracle address

can only be called by addressbook owner

#### Parameters:

- `_oracle`: oracle address

### Function `getAddress(bytes32 _key) → address` (public)

return an address for specific key

#### Parameters:

- `_key`: key address

### Function `setAddress(bytes32 _key, address _address)` (public)

set a specific address for a specific key

can only be called by addressbook owner

#### Parameters:

- `_key`: key

- `_address`: address

### Function `updateImpl(bytes32 _id, address _newAddress)` (public)

internal function to update the implementation of a specific component of the protocol

#### Parameters:

- `_id`: the id of the contract to be updated

- `_newAddress`: the address of the new implementation*

### Event `ProxyCreated(bytes32 id, address proxy)`

event emitted when a new proxy get created

### Event `AddressAdded(bytes32 id, address add)`

event emitted when a new address get added
