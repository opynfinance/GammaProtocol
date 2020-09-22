# Functions:

- `constructor(address _addressBook) (public)`

- `isWhitelistedProduct(address _underlying, address _strike, address _collateral, bool _isPut) (external)`

- `isWhitelistedCollateral(address _collateral) (external)`

- `isWhitelistedOtoken(address _otoken) (external)`

- `isWhitelistedCallee(address _callee) (external)`

- `whitelistProduct(address _underlying, address _strike, address _collateral, bool _isPut) (external)`

- `blacklistProduct(address _underlying, address _strike, address _collateral, bool _isPut) (external)`

- `whitelistCollateral(address _collateral) (external)`

- `blacklistCollateral(address _collateral) (external)`

- `whitelistOtoken(address _otokenAddress) (external)`

- `blacklistOtoken(address _otokenAddress) (external)`

- `whitelisteCallee(address _callee) (external)`

- `blacklistCallee(address _callee) (external)`

# Events:

- [`ProductWhitelisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`]

- [`ProductBlacklisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`]

- [`CollateralWhitelisted(address collateral)`]

- [`CollateralBlacklisted(address collateral)`]

- [`OtokenWhitelisted(address otoken)`]

- [`OtokenBlacklisted(address otoken)`]

- [`CalleeWhitelisted(address _callee)`]

- [`CalleeBlacklisted(address _callee)`]

# Function `constructor(address _addressBook)` (public)

constructor

## Parameters:

- `_addressBook`: AddressBook module address

# Function `isWhitelistedProduct(address _underlying, address _strike, address _collateral, bool _isPut) → bool` (external)

check if a product is whitelisted

product = the hash of underlying, strike and collateral asset

## Parameters:

- `_underlying`: asset that the option references

- `_strike`: asset that the strike price is denominated in

- `_collateral`: asset that is held as collateral against short/written options

## Return Values:

- true if product is whitelisted

# Function `isWhitelistedCollateral(address _collateral) → bool` (external)

check if the collateral is whitelisted

## Parameters:

- `_collateral`: asset that is held as collateral against short/written options

## Return Values:

- true if the collateral is whitelisted

# Function `isWhitelistedOtoken(address _otoken) → bool` (external)

check if an otoken is whitelisted

## Parameters:

- `_otoken`: otoken address

## Return Values:

- true if otoken is whitelisted

# Function `isWhitelistedCallee(address _callee) → bool` (external)

check if a callee address is whitelisted for call acton

## Parameters:

- `_callee`: destination address

## Return Values:

- true if address is whitelisted

# Function `whitelistProduct(address _underlying, address _strike, address _collateral, bool _isPut)` (external)

allow owner to whitelist product

a product is the hash of the underlying, collateral and strike assets

can only be called from owner address

## Parameters:

- `_underlying`: asset that the option references

- `_strike`: asset that the strike price is denominated in

- `_collateral`: asset that is held as collateral against short/written options

- `_isPut`: is this a put option, if not it is a call

# Function `blacklistProduct(address _underlying, address _strike, address _collateral, bool _isPut)` (external)

allow owner to blacklist product

a product is the hash of the underlying, collateral and strike assets

can only be called from owner address

## Parameters:

- `_underlying`: asset that the option references

- `_strike`: asset that the strike price is denominated in

- `_collateral`: asset that is held as collateral against short/written options

- `_isPut`: is this a put option, if not it is a call

# Function `whitelistCollateral(address _collateral)` (external)

whitelist a collateral address, can only be called by owner

function can only be called by owner

## Parameters:

- `_collateral`: collateral asset address

# Function `blacklistCollateral(address _collateral)` (external)

whitelist a collateral address, can only be called by owner

function can only be called by owner

## Parameters:

- `_collateral`: collateral asset address

# Function `whitelistOtoken(address _otokenAddress)` (external)

allow Otoken Factory to whitelist a new option

can only be called from the Otoken Factory address

## Parameters:

- `_otokenAddress`: otoken

# Function `blacklistOtoken(address _otokenAddress)` (external)

allow owner to blacklist a new option

can only be called from the owner's address

## Parameters:

- `_otokenAddress`: otoken

# Function `whitelisteCallee(address _callee)` (external)

allow Owner to whitelisted a callee address

can only be called from the owner address

## Parameters:

- `_callee`: callee address

# Function `blacklistCallee(address _callee)` (external)

allow owner to blacklist a destination address for call action

can only be called from the owner's address

## Parameters:

- `_callee`: callee address

# Event `ProductWhitelisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`

emitted when owner whitelist a product

# Event `ProductBlacklisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`

emitted when owner blacklist a product

# Event `CollateralWhitelisted(address collateral)`

emits an event when a collateral address is whitelisted by the owner address

# Event `CollateralBlacklisted(address collateral)`

emits an event when a collateral address is blacklist by the owner address

# Event `OtokenWhitelisted(address otoken)`

emitted when Otoken Factory module whitelist an otoken

# Event `OtokenBlacklisted(address otoken)`

emitted when owner blacklist an otoken

# Event `CalleeWhitelisted(address _callee)`

emitted when owner whitelist a callee address

# Event `CalleeBlacklisted(address _callee)`

emitted when owner blacklist a callee address
