## `OtokenFactory`

SPDX-License-Identifier: UNLICENSED

Create new otokens and keep track of all created tokens.

Calculate contract address before each creation with CREATE2

and deploy eip-1167 minimal proxies for otoken logic contract.

### `constructor(address _addressBook)` (public)

### `createOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → address` (external)

create new otokens

deploy an eip-1167 minimal proxy with CREATE2 and register it to the whitelist module.

### `getOtokensLength() → uint256` (external)

Get the total otokens created by the factory.

### `getOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → address` (external)

get the otoken address. If no token has been created with these parameters, will return address(0).

### `getTargetOtokenAddress(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → address` (external)

get the address at which a new otoken with these paramters will be deployed

return the exact address that will be deployed at with _computeAddress

### `_getOptionId(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → bytes32` (internal)

internal function to hash paramters and get option id. Each option has a unique id.

### `OtokenCreated(address tokenAddress, address creator, address underlying, address strike, address collateral, uint256 strikePrice, uint256 expiry, bool isPut)`

emitted when factory create a new Option
