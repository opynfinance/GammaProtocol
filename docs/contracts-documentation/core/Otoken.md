# `Otoken`

Otoken is the ERC20 token for an option

The Otoken inherits ERC20Upgradeable because we need to use the init instead of constructor

## Functions:

- `init(address _addressBook, address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiryTimestamp, bool _isPut) (external)`

- `getOtokenDetails() (external)`

- `mintOtoken(address account, uint256 amount) (external)`

- `burnOtoken(address account, uint256 amount) (external)`

- `_getNameAndSymbol() (internal)`

- `_getDisplayedStrikePrice(uint256 _strikePrice) (internal)`

- `_uintTo2Chars(uint256 number) (internal)`

- `_getOptionType(bool _isPut) (internal)`

- `_slice(string _s, uint256 _start, uint256 _end) (internal)`

- `_getMonth(uint256 _month) (internal)`

### Function `init(address _addressBook, address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiryTimestamp, bool _isPut) external`

initialize the oToken

#### Parameters:

- `_addressBook`: addressbook module

- `_underlyingAsset`: asset that the option references

- `_strikeAsset`: asset that the strike price is denominated in

- `_collateralAsset`: asset that is held as collateral against short/written options

- `_strikePrice`: strike price with decimals = 8

- `_expiryTimestamp`: expiration timestamp of the option, represented as a unix timestamp

- `_isPut`: True if a put option, False if a call option

### Function `getOtokenDetails() → address, address, address, uint256, uint256, bool external`

### Function `mintOtoken(address account, uint256 amount) external`

mint oToken for an account

Controller only method where access control is taken care of by _beforeTokenTransfer hook

#### Parameters:

- `account`: account to mint token to

- `amount`: amount to mint

### Function `burnOtoken(address account, uint256 amount) external`

burn oToken from an account.

Controller only method where access control is taken care of by _beforeTokenTransfer hook

#### Parameters:

- `account`: account to burn token from

- `amount`: amount to burn

### Function `_getNameAndSymbol() → string tokenName, string tokenSymbol internal`

generates the name and symbol for an option

this function uses a named return variable to avoid the stack-too-deep error

#### Return Values:

- tokenName (ex: ETHUSDC 05-September-2020 200 Put USDC Collateral)

- tokenSymbol (ex: oETHUSDC-05SEP20-200P)

### Function `_getDisplayedStrikePrice(uint256 _strikePrice) → string internal`

convert strike price scaled by 1e8 to human readable number string

#### Parameters:

- `_strikePrice`: strike price scaled by 1e8

#### Return Values:

- strike price string

### Function `_uintTo2Chars(uint256 number) → string internal`

return a representation of a number using 2 characters, adds a leading 0 if one digit, uses two trailing digits if a 3 digit number

#### Return Values:

- 2 characters that corresponds to a number

### Function `_getOptionType(bool _isPut) → string shortString, string longString internal`

return string representation of option type

#### Return Values:

- shortString a 1 character representation of option type (P or C)

- longString a full length string of option type (Put or Call)

### Function `_slice(string _s, uint256 _start, uint256 _end) → string internal`

cut string s into s[start:end]

#### Parameters:

- `_s`: the string to cut

- `_start`: the starting index

- `_end`: the ending index (excluded in the substring)

### Function `_getMonth(uint256 _month) → string shortString, string longString internal`

return string representation of a month

#### Return Values:

- shortString a 3 character representation of a month (ex: SEP, DEC, etc)

- longString a full length string of a month (ex: September, December, etc)
