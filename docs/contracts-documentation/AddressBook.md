# Functions:

- [`getOtokenImpl()`]

- [`getOtokenFactory()`]

- [`getWhitelist()`]

- [`getController()`]

- [`getMarginPool()`]

- [`getMarginCalculator()`]

- [`getLiquidationManager()`]

- [`getOracle()`]

- [`setOtokenImpl(address _otokenImpl)`]

- [`setOtokenFactory(address _otokenFactory)`]

- [`setWhitelist(address _whitelist)`]

- [`setController(address _controller)`]

- [`setMarginPool(address _marginPool)`]

- [`setMarginCalculator(address _marginCalculator)`]

- [`setLiquidationManager(address _liquidationManager)`]

- [`setOracle(address _oracle)`]

- [`getAddress(bytes32 _key)`]

- [`setAddress(bytes32 _key, address _address)`]

- [`updateImpl(bytes32 _id, address _newAddress)`]

# Events:

- [`ProxyCreated(bytes32 id, address proxy)`]

- [`AddressAdded(bytes32 id, address add)`]

# Function `getOtokenImpl() → address`

No description

## Return Values:

- otoken implementation address

# Function `getOtokenFactory() → address`

No description

## Return Values:

- otoken factory address

# Function `getWhitelist() → address`

No description

## Return Values:

- whitelist address

# Function `getController() → address`

No description

## Return Values:

- controller address

# Function `getMarginPool() → address`

No description

## Return Values:

- pool address

# Function `getMarginCalculator() → address`

No description

## Return Values:

- margin calculator address

# Function `getLiquidationManager() → address`

No description

## Return Values:

- liquidation manager address

# Function `getOracle() → address`

No description

## Return Values:

- oracle address

# Function `setOtokenImpl(address _otokenImpl)`

can only be called by addressbook owner

## Parameters:

- `_otokenImpl`: otoken implementation address

# Function `setOtokenFactory(address _otokenFactory)`

can only be called by addressbook owner

## Parameters:

- `_otokenFactory`: otoken factory address

# Function `setWhitelist(address _whitelist)`

can only be called by addressbook owner

## Parameters:

- `_whitelist`: whitelist address

# Function `setController(address _controller)`

can only be called by addressbook owner

## Parameters:

- `_controller`: controller address

# Function `setMarginPool(address _marginPool)`

can only be called by addressbook owner

## Parameters:

- `_marginPool`: pool address

# Function `setMarginCalculator(address _marginCalculator)`

can only be called by addressbook owner

## Parameters:

- `_marginCalculator`: margin calculator address

# Function `setLiquidationManager(address _liquidationManager)`

can only be called by addressbook owner

## Parameters:

- `_liquidationManager`: liquidation manager address

# Function `setOracle(address _oracle)`

can only be called by addressbook owner

## Parameters:

- `_oracle`: oracle address

# Function `getAddress(bytes32 _key) → address`

No description

## Parameters:

- `_key`: key address

# Function `setAddress(bytes32 _key, address _address)`

can only be called by addressbook owner

## Parameters:

- `_key`: key

- `_address`: address

# Function `updateImpl(bytes32 _id, address _newAddress)`

internal function to update the implementation of a specific component of the protocol

## Parameters:

- `_id`: the id of the contract to be updated

- `_newAddress`: the address of the new implementation*

# Event `ProxyCreated(bytes32 id, address proxy)`

No description

# Event `AddressAdded(bytes32 id, address add)`

No description
