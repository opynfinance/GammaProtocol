# `ERC20Upgradeable`

Implementation of the {IERC20} interface.

This implementation is agnostic to the way tokens are created. This means

that a supply mechanism has to be added in a derived contract using {_mint}.

For a generic mechanism see {ERC20PresetMinterPauser}.

TIP: For a detailed writeup see our guide

https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How

to implement supply mechanisms].

We have followed general OpenZeppelin guidelines: functions revert instead

of returning `false` on failure. This behavior is nonetheless conventional

and does not conflict with the expectations of ERC20 applications.

Additionally, an {Approval} event is emitted on calls to {transferFrom}.

This allows applications to reconstruct the allowance for all accounts just

by listening to said events. Other implementations of the EIP may not emit

these events, as it isn't required by the specification.

Finally, the non-standard {decreaseAllowance} and {increaseAllowance}

functions have been added to mitigate the well-known issues around setting

allowances. See {IERC20-approve}.

## Functions:

- `__ERC20_init(string name_, string symbol_) (internal)`

- `__ERC20_init_unchained(string name_, string symbol_) (internal)`

- `name() (public)`

- `symbol() (public)`

- `decimals() (public)`

- `totalSupply() (public)`

- `balanceOf(address account) (public)`

- `transfer(address recipient, uint256 amount) (public)`

- `allowance(address owner, address spender) (public)`

- `approve(address spender, uint256 amount) (public)`

- `transferFrom(address sender, address recipient, uint256 amount) (public)`

- `increaseAllowance(address spender, uint256 addedValue) (public)`

- `decreaseAllowance(address spender, uint256 subtractedValue) (public)`

- `_transfer(address sender, address recipient, uint256 amount) (internal)`

- `_mint(address account, uint256 amount) (internal)`

- `_burn(address account, uint256 amount) (internal)`

- `_approve(address owner, address spender, uint256 amount) (internal)`

- `_setupDecimals(uint8 decimals_) (internal)`

- `_beforeTokenTransfer(address from, address to, uint256 amount) (internal)`

### Function `__ERC20_init(string name_, string symbol_) internal`

Sets the values for {name} and {symbol}, initializes {decimals} with

a default value of 18.

To select a different value for {decimals}, use {_setupDecimals}.

All three of these values are immutable: they can only be set once during

construction.

### Function `__ERC20_init_unchained(string name_, string symbol_) internal`

### Function `name() → string public`

Returns the name of the token.

### Function `symbol() → string public`

Returns the symbol of the token, usually a shorter version of the

name.

### Function `decimals() → uint8 public`

Returns the number of decimals used to get its user representation.

For example, if `decimals` equals `2`, a balance of `505` tokens should

be displayed to a user as `5,05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between

Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is

called.

NOTE: This information is only used for _display_ purposes: it in

no way affects any of the arithmetic of the contract, including

{IERC20-balanceOf} and {IERC20-transfer}.

### Function `totalSupply() → uint256 public`

See {IERC20-totalSupply}.

### Function `balanceOf(address account) → uint256 public`

See {IERC20-balanceOf}.

### Function `transfer(address recipient, uint256 amount) → bool public`

See {IERC20-transfer}.

Requirements:

- `recipient` cannot be the zero address.

- the caller must have a balance of at least `amount`.

### Function `allowance(address owner, address spender) → uint256 public`

See {IERC20-allowance}.

### Function `approve(address spender, uint256 amount) → bool public`

See {IERC20-approve}.

Requirements:

- `spender` cannot be the zero address.

### Function `transferFrom(address sender, address recipient, uint256 amount) → bool public`

See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not

required by the EIP. See the note at the beginning of {ERC20}.

Requirements:

- `sender` and `recipient` cannot be the zero address.

- `sender` must have a balance of at least `amount`.

- the caller must have allowance for ``sender``'s tokens of at least

`amount`.

### Function `increaseAllowance(address spender, uint256 addedValue) → bool public`

Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for

problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.

### Function `decreaseAllowance(address spender, uint256 subtractedValue) → bool public`

Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for

problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.

- `spender` must have allowance for the caller of at least

`subtractedValue`.

### Function `_transfer(address sender, address recipient, uint256 amount) internal`

Moves tokens `amount` from `sender` to `recipient`.

This is internal function is equivalent to {transfer}, and can be used to

e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- `sender` cannot be the zero address.

- `recipient` cannot be the zero address.

- `sender` must have a balance of at least `amount`.

### Function `_mint(address account, uint256 amount) internal`

Creates `amount` tokens and assigns them to `account`, increasing

the total supply.

Emits a {Transfer} event with `from` set to the zero address.

Requirements:

- `to` cannot be the zero address.

### Function `_burn(address account, uint256 amount) internal`

Destroys `amount` tokens from `account`, reducing the

total supply.

Emits a {Transfer} event with `to` set to the zero address.

Requirements:

- `account` cannot be the zero address.

- `account` must have at least `amount` tokens.

### Function `_approve(address owner, address spender, uint256 amount) internal`

Sets `amount` as the allowance of `spender` over the `owner` s tokens.

This internal function is equivalent to `approve`, and can be used to

e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

- `owner` cannot be the zero address.

- `spender` cannot be the zero address.

### Function `_setupDecimals(uint8 decimals_) internal`

Sets {decimals} to a value other than the default one of 18.

WARNING: This function should only be called from the constructor. Most

applications that interact with token contracts will not expect

{decimals} to ever change, and may work incorrectly if it does.

### Function `_beforeTokenTransfer(address from, address to, uint256 amount) internal`

Hook that is called before any transfer of tokens. This includes

minting and burning.

Calling conditions:

- when `from` and `to` are both non-zero, `amount` of ``from``'s tokens

will be to transferred to `to`.

- when `from` is zero, `amount` tokens will be minted for `to`.

- when `to` is zero, `amount` of ``from``'s tokens will be burned.

- `from` and `to` are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
