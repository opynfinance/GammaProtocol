The Otoken inherits ERC20Initializable because we need to use the init instead of constructor.

# Functions:

- [`init(address _addressBook, address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiryTimestamp, bool _isPut)`]

- [`mintOtoken(address account, uint256 amount)`]

- [`burnOtoken(address account, uint256 amount)`]

# Function `init(address _addressBook, address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiryTimestamp, bool _isPut)`

No description

## Parameters:

- `_underlyingAsset`: asset that the option references

- `_strikeAsset`: asset that the strike price is denominated in

- `_collateralAsset`: asset that is held as collateral against short/written options

- `_strikePrice`: strike price with decimals = 18

- `_expiryTimestamp`: time of the option represented by unix timestamp

- `_isPut`: is this a put option, if not it is a call

# Function `mintOtoken(address account, uint256 amount)`

this is a Controller only method. Access control is taken care of by _beforeTokenTransfer hook.

## Parameters:

- `account`: the account to mint token to

- `amount`: the amount to mint

# Function `burnOtoken(address account, uint256 amount)`

this is a Controller only method. Access control is taken care of by _beforeTokenTransfer hook.

## Parameters:

- `account`: the account to burn token from

- `amount`: the amount to burn
