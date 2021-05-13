# `Whitelist`

The whitelist module keeps track of all valid oToken addresses, product hashes, collateral addresses, and callee addresses.

## Modifiers:

- `onlyFactory()`

## Functions:

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

- `whitelistCallee(address _callee) (external)`

- `blacklistCallee(address _callee) (external)`

## Events:

- `ProductWhitelisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`

- `ProductBlacklisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`

- `CollateralWhitelisted(address collateral)`

- `CollateralBlacklisted(address collateral)`

- `OtokenWhitelisted(address otoken)`

- `OtokenBlacklisted(address otoken)`

- `CalleeWhitelisted(address _callee)`

- `CalleeBlacklisted(address _callee)`

### Modifier `onlyFactory()`

check if the sender is the oTokenFactory module

### Function `constructor(address _addressBook) public`

constructor

#### Parameters:

- `_addressBook`: AddressBook module address

### Function `isWhitelistedProduct(address _underlying, address _strike, address _collateral, bool _isPut) → bool external`

check if a product is whitelisted

product is the hash of underlying asset, strike asset, collateral asset, and isPut

#### Parameters:

- `_underlying`: asset that the option references

- `_strike`: asset that the strike price is denominated in

- `_collateral`: asset that is held as collateral against short/written options

- `_isPut`: True if a put option, False if a call option

#### Return Values:

- True if product is whitelisted

### Function `isWhitelistedCollateral(address _collateral) → bool external`

check if a collateral asset is whitelisted

#### Parameters:

- `_collateral`: asset that is held as collateral against short/written options

#### Return Values:

- True if the collateral is whitelisted

### Function `isWhitelistedOtoken(address _otoken) → bool external`

check if an oToken is whitelisted

#### Parameters:

- `_otoken`: oToken address

#### Return Values:

- True if the oToken is whitelisted

### Function `isWhitelistedCallee(address _callee) → bool external`

check if a callee address is whitelisted for the call action

#### Parameters:

- `_callee`: callee destination address

#### Return Values:

- True if the address is whitelisted

### Function `whitelistProduct(address _underlying, address _strike, address _collateral, bool _isPut) external`

allows the owner to whitelist a product

product is the hash of underlying asset, strike asset, collateral asset, and isPut

can only be called from the owner address

#### Parameters:

- `_underlying`: asset that the option references

- `_strike`: asset that the strike price is denominated in

- `_collateral`: asset that is held as collateral against short/written options

- `_isPut`: True if a put option, False if a call option

### Function `blacklistProduct(address _underlying, address _strike, address _collateral, bool _isPut) external`

allow the owner to blacklist a product

product is the hash of underlying asset, strike asset, collateral asset, and isPut

can only be called from the owner address

#### Parameters:

- `_underlying`: asset that the option references

- `_strike`: asset that the strike price is denominated in

- `_collateral`: asset that is held as collateral against short/written options

- `_isPut`: True if a put option, False if a call option

### Function `whitelistCollateral(address _collateral) external`

allows the owner to whitelist a collateral address

can only be called from the owner address. This function is used to whitelist any asset other than Otoken as collateral. WhitelistOtoken() is used to whitelist Otoken contracts.

#### Parameters:

- `_collateral`: collateral asset address

### Function `blacklistCollateral(address _collateral) external`

allows the owner to blacklist a collateral address

can only be called from the owner address

#### Parameters:

- `_collateral`: collateral asset address

### Function `whitelistOtoken(address _otokenAddress) external`

allows the OtokenFactory module to whitelist a new option

can only be called from the OtokenFactory address

#### Parameters:

- `_otokenAddress`: oToken

### Function `blacklistOtoken(address _otokenAddress) external`

allows the owner to blacklist an option

can only be called from the owner address

#### Parameters:

- `_otokenAddress`: oToken

### Function `whitelistCallee(address _callee) external`

allows the owner to whitelist a destination address for the call action

can only be called from the owner address

#### Parameters:

- `_callee`: callee address

### Function `blacklistCallee(address _callee) external`

allows the owner to blacklist a destination address for the call action

can only be called from the owner address

#### Parameters:

- `_callee`: callee address

### Event `ProductWhitelisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`

emits an event a product is whitelisted by the owner address

### Event `ProductBlacklisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`

emits an event a product is blacklisted by the owner address

### Event `CollateralWhitelisted(address collateral)`

emits an event when a collateral address is whitelisted by the owner address

### Event `CollateralBlacklisted(address collateral)`

emits an event when a collateral address is blacklist by the owner address

### Event `OtokenWhitelisted(address otoken)`

emits an event when an oToken is whitelisted by the OtokenFactory module

### Event `OtokenBlacklisted(address otoken)`

emits an event when an oToken is blacklisted by the OtokenFactory module

### Event `CalleeWhitelisted(address _callee)`

emits an event when a callee address is whitelisted by the owner address

### Event `CalleeBlacklisted(address _callee)`

emits an event when a callee address is blacklisted by the owner address
