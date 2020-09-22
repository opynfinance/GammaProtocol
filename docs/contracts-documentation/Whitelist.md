# Functions:

- [`constructor(address _addressBook)`]

- [`isWhitelistedProduct(address _underlying, address _strike, address _collateral, bool _isPut)`]

- [`isWhitelistedCollateral(address _collateral)`]

- [`isWhitelistedOtoken(address _otoken)`]

- [`isWhitelistedCallee(address _callee)`]

- [`whitelistProduct(address _underlying, address _strike, address _collateral, bool _isPut)`]

- [`blacklistProduct(address _underlying, address _strike, address _collateral, bool _isPut)`]

- [`whitelistCollateral(address _collateral)`]

- [`blacklistCollateral(address _collateral)`]

- [`whitelistOtoken(address _otokenAddress)`]

- [`blacklistOtoken(address _otokenAddress)`]

- [`whitelisteCallee(address _callee)`]

- [`blacklistCallee(address _callee)`]

# Events:

- [`ProductWhitelisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`]

- [`ProductBlacklisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`]

- [`CollateralWhitelisted(address collateral)`]

- [`CollateralBlacklisted(address collateral)`]

- [`OtokenWhitelisted(address otoken)`]

- [`OtokenBlacklisted(address otoken)`]

- [`CalleeWhitelisted(address _callee)`]

- [`CalleeBlacklisted(address _callee)`]

# Function `constructor(address _addressBook)` {#Whitelist-constructor-address-}

constructor

## Parameters:

- `_addressBook`: AddressBook module address

# Function `isWhitelistedProduct(address _underlying, address _strike, address _collateral, bool _isPut) → bool` {#Whitelist-isWhitelistedProduct-address-address-address-bool-}

product = the hash of underlying, strike and collateral asset

## Parameters:

- `_underlying`: asset that the option references

- `_strike`: asset that the strike price is denominated in

- `_collateral`: asset that is held as collateral against short/written options

## Return Values:

- true if product is whitelisted

# Function `isWhitelistedCollateral(address _collateral) → bool` {#Whitelist-isWhitelistedCollateral-address-}

No description

## Parameters:

- `_collateral`: asset that is held as collateral against short/written options

## Return Values:

- true if the collateral is whitelisted

# Function `isWhitelistedOtoken(address _otoken) → bool` {#Whitelist-isWhitelistedOtoken-address-}

No description

## Parameters:

- `_otoken`: otoken address

## Return Values:

- true if otoken is whitelisted

# Function `isWhitelistedCallee(address _callee) → bool` {#Whitelist-isWhitelistedCallee-address-}

No description

## Parameters:

- `_callee`: destination address

## Return Values:

- true if address is whitelisted

# Function `whitelistProduct(address _underlying, address _strike, address _collateral, bool _isPut)` {#Whitelist-whitelistProduct-address-address-address-bool-}

a product is the hash of the underlying, collateral and strike assets

can only be called from owner address

## Parameters:

- `_underlying`: asset that the option references

- `_strike`: asset that the strike price is denominated in

- `_collateral`: asset that is held as collateral against short/written options

- `_isPut`: is this a put option, if not it is a call

# Function `blacklistProduct(address _underlying, address _strike, address _collateral, bool _isPut)` {#Whitelist-blacklistProduct-address-address-address-bool-}

a product is the hash of the underlying, collateral and strike assets

can only be called from owner address

## Parameters:

- `_underlying`: asset that the option references

- `_strike`: asset that the strike price is denominated in

- `_collateral`: asset that is held as collateral against short/written options

- `_isPut`: is this a put option, if not it is a call

# Function `whitelistCollateral(address _collateral)` {#Whitelist-whitelistCollateral-address-}

function can only be called by owner

## Parameters:

- `_collateral`: collateral asset address

# Function `blacklistCollateral(address _collateral)` {#Whitelist-blacklistCollateral-address-}

function can only be called by owner

## Parameters:

- `_collateral`: collateral asset address

# Function `whitelistOtoken(address _otokenAddress)` {#Whitelist-whitelistOtoken-address-}

can only be called from the Otoken Factory address

## Parameters:

- `_otokenAddress`: otoken

# Function `blacklistOtoken(address _otokenAddress)` {#Whitelist-blacklistOtoken-address-}

can only be called from the owner's address

## Parameters:

- `_otokenAddress`: otoken

# Function `whitelisteCallee(address _callee)` {#Whitelist-whitelisteCallee-address-}

can only be called from the owner address

## Parameters:

- `_callee`: callee address

# Function `blacklistCallee(address _callee)` {#Whitelist-blacklistCallee-address-}

can only be called from the owner's address

## Parameters:

- `_callee`: callee address

# Event `ProductWhitelisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)` {#Whitelist-ProductWhitelisted-bytes32-address-address-address-bool-}

No description

# Event `ProductBlacklisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)` {#Whitelist-ProductBlacklisted-bytes32-address-address-address-bool-}

No description

# Event `CollateralWhitelisted(address collateral)` {#Whitelist-CollateralWhitelisted-address-}

No description

# Event `CollateralBlacklisted(address collateral)` {#Whitelist-CollateralBlacklisted-address-}

No description

# Event `OtokenWhitelisted(address otoken)` {#Whitelist-OtokenWhitelisted-address-}

No description

# Event `OtokenBlacklisted(address otoken)` {#Whitelist-OtokenBlacklisted-address-}

No description

# Event `CalleeWhitelisted(address _callee)` {#Whitelist-CalleeWhitelisted-address-}

No description

# Event `CalleeBlacklisted(address _callee)` {#Whitelist-CalleeBlacklisted-address-}

No description
