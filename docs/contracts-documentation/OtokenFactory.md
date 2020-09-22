Calculate contract address before each creation with CREATE2

and deploy eip-1167 minimal proxies for otoken logic contract.

# Functions:

- [`constructor(address _addressBook)`]

- [`createOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut)`]

- [`getOtokensLength()`]

- [`getOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut)`]

- [`getTargetOtokenAddress(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut)`]

# Events:

- [`OtokenCreated(address tokenAddress, address creator, address underlying, address strike, address collateral, uint256 strikePrice, uint256 expiry, bool isPut)`]

# Function `constructor(address _addressBook)` {#OtokenFactory-constructor-address-}

No description

# Function `createOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → address` {#OtokenFactory-createOtoken-address-address-address-uint256-uint256-bool-}

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

# Function `getOtokensLength() → uint256` {#OtokenFactory-getOtokensLength--}

No description

## Return Values:

- length of the otokens array.

# Function `getOtoken(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → address` {#OtokenFactory-getOtoken-address-address-address-uint256-uint256-bool-}

No description

## Parameters:

- `_underlyingAsset`: asset that the option references

- `_strikeAsset`: asset that the strike price is denominated in

- `_collateralAsset`: asset that is held as collateral against short/written options

- `_strikePrice`: strike price with decimals = 18

- `_expiry`: expiration timestamp in second

- `_isPut`: is this a put option, if not it is a call

## Return Values:

- otoken the address of target otoken.

# Function `getTargetOtokenAddress(address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiry, bool _isPut) → address` {#OtokenFactory-getTargetOtokenAddress-address-address-address-uint256-uint256-bool-}

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

# Event `OtokenCreated(address tokenAddress, address creator, address underlying, address strike, address collateral, uint256 strikePrice, uint256 expiry, bool isPut)` {#OtokenFactory-OtokenCreated-address-address-address-address-address-uint256-uint256-bool-}

No description
