# `OtokenFactory`

SPDX-License-Identifier: UNLICENSED

Create new oTokens and keep track of all created tokens

Calculate contract address before each creation with CREATE2

and deploy eip-1167 minimal proxies for oToken logic contract

## Functions:

- `constructor(address _addressBook) (public)`

- `createOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) (external)`

- `getOtokensLength() (external)`

- `getOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) (external)`

- `getTargetOtokenAddress(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) (external)`

- `_getOptionId(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) (internal)`

## Events:

- `OtokenCreated(address tokenAddress, address creator, address underlying, address strike, address collateral, uint256 strikePrice, uint256 expiry, bool isPut)`

### Function `constructor(address _addressBook) public`

### Function `createOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → address external`

create new oTokens

deploy an eip-1167 minimal proxy with CREATE2 and register it to the whitelist module

#### Parameters:

- `_underlyingAsset`: asset that the option references

- `_strikeAsset`: asset that the strike price is denominated in

- `_collateralAsset`: asset that is held as collateral against short/written options

- `_strikePrice`: strike price with decimals = 18

- `_expiry`: expiration timestamp as a unix timestamp

- `_isPut`: True if a put option, False if a call option

#### Return Values:

- newOtoken address of the newly created option

### Function `getOtokensLength() → uint256 external`

get the total oTokens created by the factory

#### Return Values:

- length of the oTokens array

### Function `getOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → address external`

get the oToken address for an already created oToken, if no oToken has been created with these parameters, it will return address(0)

#### Parameters:

- `_underlyingAsset`: asset that the option references

- `_strikeAsset`: asset that the strike price is denominated in

- `_collateralAsset`: asset that is held as collateral against short/written options

- `_strikePrice`: strike price with decimals = 18

- `_expiry`: expiration timestamp as a unix timestamp

- `_isPut`: True if a put option, False if a call option

#### Return Values:

- the address of target otoken.

### Function `getTargetOtokenAddress(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → address external`

get the address at which a new oToken with these parameters would be deployed

return the exact address that will be deployed at with _computeAddress

#### Parameters:

- `_underlyingAsset`: asset that the option references

- `_strikeAsset`: asset that the strike price is denominated in

- `_collateralAsset`: asset that is held as collateral against short/written options

- `_strikePrice`: strike price with decimals = 18

- `_expiry`: expiration timestamp as a unix timestamp

- `_isPut`: True if a put option, False if a call option

#### Return Values:

- targetAddress the address this oToken would be deployed at

### Function `_getOptionId(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → bytes32 internal`

hash oToken parameters and return a unique option id

#### Parameters:

- `_underlyingAsset`: asset that the option references

- `_strikeAsset`: asset that the strike price is denominated in

- `_collateralAsset`: asset that is held as collateral against short/written options

- `_strikePrice`: strike price with decimals = 18

- `_expiry`: expiration timestamp as a unix timestamp

- `_isPut`: True if a put option, False if a call option

#### Return Values:

- id the unique id of an oToken

### Event `OtokenCreated(address tokenAddress, address creator, address underlying, address strike, address collateral, uint256 strikePrice, uint256 expiry, bool isPut)`

emitted when the factory creates a new Option
