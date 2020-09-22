## `Whitelist`

The whitelist module keeps track of all valid Otoken contracts.

### `onlyFactory()`

check if the sender is the Otoken Factory module

### `constructor(address _addressBook)` (public)

constructor

### `isWhitelistedProduct(address _underlying, address _strike, address _collateral, bool _isPut) → bool` (external)

check if a product is whitelisted

product = the hash of underlying, strike and collateral asset

### `isWhitelistedCollateral(address _collateral) → bool` (external)

check if the collateral is whitelisted

### `isWhitelistedOtoken(address _otoken) → bool` (external)

check if an otoken is whitelisted

### `isWhitelistedCallee(address _callee) → bool` (external)

check if a callee address is whitelisted for call acton

### `whitelistProduct(address _underlying, address _strike, address _collateral, bool _isPut)` (external)

allow owner to whitelist product

a product is the hash of the underlying, collateral and strike assets

can only be called from owner address

### `blacklistProduct(address _underlying, address _strike, address _collateral, bool _isPut)` (external)

allow owner to blacklist product

a product is the hash of the underlying, collateral and strike assets

can only be called from owner address

### `whitelistCollateral(address _collateral)` (external)

whitelist a collateral address, can only be called by owner

function can only be called by owner

### `blacklistCollateral(address _collateral)` (external)

whitelist a collateral address, can only be called by owner

function can only be called by owner

### `whitelistOtoken(address _otokenAddress)` (external)

allow Otoken Factory to whitelist a new option

can only be called from the Otoken Factory address

### `blacklistOtoken(address _otokenAddress)` (external)

allow owner to blacklist a new option

can only be called from the owner's address

### `whitelisteCallee(address _callee)` (external)

allow Owner to whitelisted a callee address

can only be called from the owner address

### `blacklistCallee(address _callee)` (external)

allow owner to blacklist a destination address for call action

can only be called from the owner's address

### `ProductWhitelisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`

emitted when owner whitelist a product

### `ProductBlacklisted(bytes32 productHash, address underlying, address strike, address collateral, bool isPut)`

emitted when owner blacklist a product

### `CollateralWhitelisted(address collateral)`

emits an event when a collateral address is whitelisted by the owner address

### `CollateralBlacklisted(address collateral)`

emits an event when a collateral address is blacklist by the owner address

### `OtokenWhitelisted(address otoken)`

emitted when Otoken Factory module whitelist an otoken

### `OtokenBlacklisted(address otoken)`

emitted when owner blacklist an otoken

### `CalleeWhitelisted(address _callee)`

emitted when owner whitelist a callee address

### `CalleeBlacklisted(address _callee)`

emitted when owner blacklist a callee address
