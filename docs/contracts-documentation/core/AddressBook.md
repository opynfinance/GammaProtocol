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

### Function `getOtokenImpl() → address external`

return Otoken implementation address

#### Return Values:

- Otoken implementation address

### Function `getOtokenFactory() → address external`

return oTokenFactory address

#### Return Values:

- OtokenFactory address

### Function `getWhitelist() → address external`

return Whitelist address

#### Return Values:

- Whitelist address

### Function `getController() → address external`

return Controller address

#### Return Values:

- Controller address

### Function `getMarginPool() → address external`

return MarginPool address

#### Return Values:

- MarginPool address

### Function `getMarginCalculator() → address external`

return MarginCalculator address

#### Return Values:

- MarginCalculator address

### Function `getLiquidationManager() → address external`

return LiquidationManager address

#### Return Values:

- LiquidationManager address

### Function `getOracle() → address external`

return Oracle address

#### Return Values:

- Oracle address

### Function `setOtokenImpl(address _otokenImpl) external`

set Otoken implementation address

can only be called by the addressbook owner

#### Parameters:

- `_otokenImpl`: Otoken implementation address

### Function `setOtokenFactory(address _otokenFactory) external`

set OtokenFactory address

can only be called by the addressbook owner

#### Parameters:

- `_otokenFactory`: OtokenFactory address

### Function `setWhitelist(address _whitelist) external`

set Whitelist address

can only be called by the addressbook owner

#### Parameters:

- `_whitelist`: Whitelist address

### Function `setController(address _controller) external`

set Controller address

can only be called by the addressbook owner

#### Parameters:

- `_controller`: Controller address

### Function `setMarginPool(address _marginPool) external`

set MarginPool address

can only be called by the addressbook owner

#### Parameters:

- `_marginPool`: MarginPool address

### Function `setMarginCalculator(address _marginCalculator) external`

set MarginCalculator address

can only be called by the addressbook owner

#### Parameters:

- `_marginCalculator`: MarginCalculator address

### Function `setLiquidationManager(address _liquidationManager) external`

set LiquidationManager address

can only be called by the addressbook owner

#### Parameters:

- `_liquidationManager`: LiquidationManager address

### Function `setOracle(address _oracle) external`

set Oracle address

can only be called by the addressbook owner

#### Parameters:

- `_oracle`: Oracle address

### Function `getAddress(bytes32 _key) → address public`

return an address for specific key

#### Parameters:

- `_key`: key address

### Function `setAddress(bytes32 _key, address _address) public`

set a specific address for a specific key

can only be called by the addressbook owner

#### Parameters:

- `_key`: key

- `_address`: address

### Function `updateImpl(bytes32 _id, address _newAddress) public`

function to update the implementation of a specific component of the protocol

#### Parameters:

- `_id`: id of the contract to be updated

- `_newAddress`: address of the new implementation*

### Event `ProxyCreated(bytes32 id, address proxy)`

emits an event when a new proxy is created

### Event `AddressAdded(bytes32 id, address add)`

emits an event when a new address is added
