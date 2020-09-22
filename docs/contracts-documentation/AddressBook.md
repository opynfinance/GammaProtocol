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

# Function `getOtokenImpl() → address` {#AddressBook-getOtokenImpl--}

No description

## Return Values:

- otoken implementation address

# Function `getOtokenFactory() → address` {#AddressBook-getOtokenFactory--}

No description

## Return Values:

- otoken factory address

# Function `getWhitelist() → address` {#AddressBook-getWhitelist--}

No description

## Return Values:

- whitelist address

# Function `getController() → address` {#AddressBook-getController--}

No description

## Return Values:

- controller address

# Function `getMarginPool() → address` {#AddressBook-getMarginPool--}

No description

## Return Values:

- pool address

# Function `getMarginCalculator() → address` {#AddressBook-getMarginCalculator--}

No description

## Return Values:

- margin calculator address

# Function `getLiquidationManager() → address` {#AddressBook-getLiquidationManager--}

No description

## Return Values:

- liquidation manager address

# Function `getOracle() → address` {#AddressBook-getOracle--}

No description

## Return Values:

- oracle address

# Function `setOtokenImpl(address _otokenImpl)` {#AddressBook-setOtokenImpl-address-}

can only be called by addressbook owner

## Parameters:

- `_otokenImpl`: otoken implementation address

# Function `setOtokenFactory(address _otokenFactory)` {#AddressBook-setOtokenFactory-address-}

can only be called by addressbook owner

## Parameters:

- `_otokenFactory`: otoken factory address

# Function `setWhitelist(address _whitelist)` {#AddressBook-setWhitelist-address-}

can only be called by addressbook owner

## Parameters:

- `_whitelist`: whitelist address

# Function `setController(address _controller)` {#AddressBook-setController-address-}

can only be called by addressbook owner

## Parameters:

- `_controller`: controller address

# Function `setMarginPool(address _marginPool)` {#AddressBook-setMarginPool-address-}

can only be called by addressbook owner

## Parameters:

- `_marginPool`: pool address

# Function `setMarginCalculator(address _marginCalculator)` {#AddressBook-setMarginCalculator-address-}

can only be called by addressbook owner

## Parameters:

- `_marginCalculator`: margin calculator address

# Function `setLiquidationManager(address _liquidationManager)` {#AddressBook-setLiquidationManager-address-}

can only be called by addressbook owner

## Parameters:

- `_liquidationManager`: liquidation manager address

# Function `setOracle(address _oracle)` {#AddressBook-setOracle-address-}

can only be called by addressbook owner

## Parameters:

- `_oracle`: oracle address

# Function `getAddress(bytes32 _key) → address` {#AddressBook-getAddress-bytes32-}

No description

## Parameters:

- `_key`: key address

# Function `setAddress(bytes32 _key, address _address)` {#AddressBook-setAddress-bytes32-address-}

can only be called by addressbook owner

## Parameters:

- `_key`: key

- `_address`: address

# Function `updateImpl(bytes32 _id, address _newAddress)` {#AddressBook-updateImpl-bytes32-address-}

internal function to update the implementation of a specific component of the protocol

## Parameters:

- `_id`: the id of the contract to be updated

- `_newAddress`: the address of the new implementation*

# Event `ProxyCreated(bytes32 id, address proxy)` {#AddressBook-ProxyCreated-bytes32-address-}

No description

# Event `AddressAdded(bytes32 id, address add)` {#AddressBook-AddressAdded-bytes32-address-}

No description
