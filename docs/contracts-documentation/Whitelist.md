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

# Function `constructor(address _addressBook)`

constructor

## Parameters:

- `_addressBook`: AddressBook module address

# Function `isWhitelistedProduct(address _underlying, address _strike, address _collateral, bool _isPut) → bool`

product = the hash of underlying, strike and collateral asset

## Parameters:

- `_underlying`: asset that the option references

- `_strike`: asset that the strike price is denominated in

- `_collateral`: asset that is held as collateral against short/written options

## Return Values:

- true if product is whitelisted

# Function `isWhitelistedCollateral(address _collateral) → bool`

No description

## Parameters:

- `_collateral`: asset that is held as collateral against short/written options

## Return Values:

- true if the collateral is whitelisted

# Function `isWhitelistedOtoken(address _otoken) → bool`

No description

## Parameters:

- `_otoken`: otoken address

## Return Values:

- true if otoken is whitelisted

# Function `isWhitelistedCallee(address _callee) → bool`

No description

## Parameters:

- `_callee`: destination address

## Return Values:

- true if address is whitelisted

# Function `whitelistProduct(address _underlying, address _strike, address _collateral, bool _isPut)`

a product is the hash of the underlying, collateral and strike assets

can only be called from owner address

## Parameters:

- `_underlying`: asset that the option references

- `_strike`: asset that the strike price is denominated in

- `_collateral`: asset that is held as collateral against short/written options

- `_isPut`: is this a put option, if not it is a call

# Function `blacklistProduct(address _underlying, address _strike, address _collateral, bool _isPut)`

a product is the hash of the underlying, collateral and strike assets

can only be called from owner address

## Parameters:

- `_underlying`: asset that the option references

- `_strike`: asset that the strike price is denominated in

- `_collateral`: asset that is held as collateral against short/written options

- `_isPut`: is this a put option, if not it is a call

# Function `whitelistCollateral(address _collateral)`

function can only be called by owner

## Parameters:

- `_collateral`: collateral asset address

# Function `blacklistCollateral(address _collateral)`

function can only be called by owner

## Parameters:

- `_collateral`: collateral asset address

# Function `whitelistOtoken(address _otokenAddress)`

can only be called from the Otoken Factory address

## Parameters:

- `_otokenAddress`: otoken

# Function `blacklistOtoken(address _otokenAddress)`

can only be called from the owner's address

## Parameters:

- `_otokenAddress`: otoken

# Function `whitelisteCallee(address _callee)`

can only be called from the owner address

## Parameters:

- `_callee`: callee address

# Function `blacklistCallee(address _callee)`

can only be called from the owner's address

## Parameters:

- `_callee`: callee address

# Event `ProductWhitelisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`

No description

# Event `ProductBlacklisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`

No description

# Event `CollateralWhitelisted(address collateral)`

No description

# Event `CollateralBlacklisted(address collateral)`

No description

# Event `OtokenWhitelisted(address otoken)`

No description

# Event `OtokenBlacklisted(address otoken)`

No description

# Event `CalleeWhitelisted(address _callee)`

No description

# Event `CalleeBlacklisted(address _callee)`

No description
