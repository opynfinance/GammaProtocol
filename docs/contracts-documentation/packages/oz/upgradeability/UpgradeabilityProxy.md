This contract represents a proxy where the implementation address to which it will delegate can be upgraded

# Functions:

- [`implementation()`](#UpgradeabilityProxy-implementation--)

# Events:

- [`Upgraded(address implementation)`](#UpgradeabilityProxy-Upgraded-address-)

# Function `implementation() → address impl` {#UpgradeabilityProxy-implementation--}

Tells the address of the current implementation

## Return Values:

- impl address of the current implementation

# Event `Upgraded(address implementation)` {#UpgradeabilityProxy-Upgraded-address-}

This event will be emitted every time the implementation gets upgraded

## Parameters:

- `implementation`: representing the address of the upgraded implementation
