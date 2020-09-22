## `Otoken`

Otoken is the ERC20 token for an option.

The Otoken inherits ERC20Initializable because we need to use the init instead of constructor.

### `init(address _addressBook, address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiryTimestamp, bool _isPut)` (external)

initialize the otoken.

### `mintOtoken(address account, uint256 amount)` (external)

Mint oToken for an account.

this is a Controller only method. Access control is taken care of by _beforeTokenTransfer hook.

### `burnOtoken(address account, uint256 amount)` (external)

Burn oToken from an account.

this is a Controller only method. Access control is taken care of by _beforeTokenTransfer hook.

### `_getNameAndSymbol() → string tokenName, string tokenSymbol` (internal)

generate name and symbol for an option

this function use named return variable to avoid stack-too-deep error

### `_getTokenSymbol(address token) → string` (internal)

get token symbol

### `_uintTo2Chars(uint256 number) → string` (internal)

Internal function to get the number with 2 characters.

### `_getOptionType(bool _isPut) → string shortString, string longString` (internal)

return string of option type

### `_getMonth(uint256 _month) → string shortString, string longString` (internal)

return string of month.

### `_beforeTokenTransfer(address from, address to, uint256 amount)` (internal)

this function overrides the _beforeTokenTransfer hook in ERC20Initializable.sol.

If the operation is mint or burn, requires msg.sender to be the controller.

The function signature is the same as _beforeTokenTransfer defined in ERC20Initializable.sol.
