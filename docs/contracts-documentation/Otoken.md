# `Otoken`

Otoken is the ERC20 token for an option.

The Otoken inherits ERC20Initializable because we need to use the init instead of constructor.

## Functions:

- `init(address _addressBook, address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiryTimestamp, bool _isPut) (external)`

- `mintOtoken(address account, uint256 amount) (external)`

- `burnOtoken(address account, uint256 amount) (external)`

- `_getNameAndSymbol() (internal)`

- `_getTokenSymbol(address token) (internal)`

- `_uintTo2Chars(uint256 number) (internal)`

- `_getOptionType(bool _isPut) (internal)`

- `_getMonth(uint256 _month) (internal)`

- `_beforeTokenTransfer(address from, address to, uint256 amount) (internal)`

### Function `init(address _addressBook, address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiryTimestamp, bool _isPut)` (external)

initialize the otoken.

#### Parameters:

- `_underlyingAsset`: asset that the option references

- `_strikeAsset`: asset that the strike price is denominated in

- `_collateralAsset`: asset that is held as collateral against short/written options

- `_strikePrice`: strike price with decimals = 18

- `_expiryTimestamp`: time of the option represented by unix timestamp

- `_isPut`: is this a put option, if not it is a call

### Function `mintOtoken(address account, uint256 amount)` (external)

Mint oToken for an account.

this is a Controller only method. Access control is taken care of by _beforeTokenTransfer hook.

#### Parameters:

- `account`: the account to mint token to

- `amount`: the amount to mint

### Function `burnOtoken(address account, uint256 amount)` (external)

Burn oToken from an account.

this is a Controller only method. Access control is taken care of by _beforeTokenTransfer hook.

#### Parameters:

- `account`: the account to burn token from

- `amount`: the amount to burn

### Function `_getNameAndSymbol() → string tokenName, string tokenSymbol` (internal)

generate name and symbol for an option

this function use named return variable to avoid stack-too-deep error

#### Return Values:

- tokenName ETHUSDC 05-September-2020 200 Put USDC Collateral

- tokenSymbol oETHUSDC-05SEP20-200P

### Function `_getTokenSymbol(address token) → string` (internal)

get token symbol

#### Parameters:

- `token`: the ERC20 token address

### Function `_uintTo2Chars(uint256 number) → string` (internal)

Internal function to get the number with 2 characters.

#### Return Values:

- The 2 characters for the number.

### Function `_getOptionType(bool _isPut) → string shortString, string longString` (internal)

return string of option type

#### Return Values:

- shortString P or C

- longString Put or Call

### Function `_getMonth(uint256 _month) → string shortString, string longString` (internal)

return string of month.

#### Return Values:

- shortString SEP, DEC ...etc

- longString September, December ...etc

### Function `_beforeTokenTransfer(address from, address to, uint256 amount)` (internal)

this function overrides the _beforeTokenTransfer hook in ERC20Initializable.sol.

If the operation is mint or burn, requires msg.sender to be the controller.

The function signature is the same as _beforeTokenTransfer defined in ERC20Initializable.sol.

#### Parameters:

- `from`: from address

- `to`: to address

- `amount`: amount to transfer
