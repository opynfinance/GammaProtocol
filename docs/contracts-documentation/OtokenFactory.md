## `OtokenFactory`

SPDX-License-Identifier: UNLICENSED

Create new otokens and keep track of all created tokens.

Calculate contract address before each creation with CREATE2

and deploy eip-1167 minimal proxies for otoken logic contract.

# Functions:

- `constructor(address _addressBook) (public)`

- `createOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) (external)`

- `getOtokensLength() (external)`

- `getOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) (external)`

- `getTargetOtokenAddress(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) (external)`

- `_getOptionId(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) (internal)`

# Events:

- `OtokenCreated(address tokenAddress, address creator, address underlying, address strike, address collateral, uint256 strikePrice, uint256 expiry, bool isPut)`

# Function `constructor(address _addressBook)` (public)

# Function `createOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → address` (external)

create new otokens

deploy an eip-1167 minimal proxy with CREATE2 and register it to the whitelist module.

## Parameters:

- `_underlyingAsset`: asset that the option references

- `_strikeAsset`: asset that the strike price is denominated in

- `_collateralAsset`: asset that is held as collateral against short/written options

- `_strikePrice`: strike price with decimals = 18

- `_expiry`: expiration timestamp in second

- `_isPut`: is this a put option, if not it is a call

## Return Values:

- newOtoken address of the newly created option

# Function `getOtokensLength() → uint256` (external)

Get the total otokens created by the factory.

## Return Values:

- length of the otokens array.

# Function `getOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → address` (external)

get the otoken address. If no token has been created with these parameters, will return address(0).

## Parameters:

- `_underlyingAsset`: asset that the option references

- `_strikeAsset`: asset that the strike price is denominated in

- `_collateralAsset`: asset that is held as collateral against short/written options

- `_strikePrice`: strike price with decimals = 18

- `_expiry`: expiration timestamp in second

- `_isPut`: is this a put option, if not it is a call

## Return Values:

- otoken the address of target otoken.

# Function `getTargetOtokenAddress(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → address` (external)

get the address at which a new otoken with these paramters will be deployed

return the exact address that will be deployed at with _computeAddress

## Parameters:

- `_underlyingAsset`: asset that the option references

- `_strikeAsset`: asset that the strike price is denominated in

- `_collateralAsset`: asset that is held as collateral against short/written options

- `_strikePrice`: strike price with decimals = 18

- `_expiry`: expiration timestamp in second

- `_isPut`: is this a put option, if not it is a call

## Return Values:

- targetAddress the address this otoken will be deployed at.

# Function `_getOptionId(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → bytes32` (internal)

internal function to hash paramters and get option id. Each option has a unique id.

## Parameters:

- `_underlyingAsset`: asset that the option references

- `_strikeAsset`: asset that the strike price is denominated in

- `_collateralAsset`: asset that is held as collateral against short/written options

- `_strikePrice`: strike price with decimals = 18

- `_expiry`: expiration timestamp in second

- `_isPut`: is this a put option, if not it is a call

## Return Values:

- id the id of an otoken

# Event `OtokenCreated(address tokenAddress, address creator, address underlying, address strike, address collateral, uint256 strikePrice, uint256 expiry, bool isPut)`

emitted when factory create a new Option
