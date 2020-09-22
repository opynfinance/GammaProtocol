Implementation of the {IERC20} interface.

# Functions:

- [`name()`]

- [`symbol()`]

- [`decimals()`]

- [`totalSupply()`]

- [`balanceOf(address account)`]

- [`transfer(address recipient, uint256 amount)`]

- [`allowance(address owner, address spender)`]

- [`approve(address spender, uint256 amount)`]

- [`transferFrom(address sender, address recipient, uint256 amount)`]

- [`increaseAllowance(address spender, uint256 addedValue)`]

- [`decreaseAllowance(address spender, uint256 subtractedValue)`]

# Function `name() → string`

Returns the name of the token.

# Function `symbol() → string`

Returns the symbol of the token, usually a shorter version of the

name.

# Function `decimals() → uint8`

Returns the number of decimals used to get its user representation.

For example, if `decimals` equals `2`, a balance of `505` tokens should

be displayed to a user as `5,05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between

Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is

called.

NOTE: This information is only used for _display_ purposes: it in

no way affects any of the arithmetic of the contract, including

{IERC20-balanceOf} and {IERC20-transfer}.

# Function `totalSupply() → uint256`

See {IERC20-totalSupply}.

# Function `balanceOf(address account) → uint256`

See {IERC20-balanceOf}.

# Function `transfer(address recipient, uint256 amount) → bool`

See {IERC20-transfer}.

Requirements:

- `recipient` cannot be the zero address.

- the caller must have a balance of at least `amount`.

# Function `allowance(address owner, address spender) → uint256`

See {IERC20-allowance}.

# Function `approve(address spender, uint256 amount) → bool`

See {IERC20-approve}.

Requirements:

- `spender` cannot be the zero address.

# Function `transferFrom(address sender, address recipient, uint256 amount) → bool`

See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not

required by the EIP. See the note at the beginning of {ERC20};

Requirements:

- `sender` and `recipient` cannot be the zero address.

- `sender` must have a balance of at least `amount`.

- the caller must have allowance for ``sender``'s tokens of at least

`amount`.

# Function `increaseAllowance(address spender, uint256 addedValue) → bool`

Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for

problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.

# Function `decreaseAllowance(address spender, uint256 subtractedValue) → bool`

Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for

problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.

- `spender` must have allowance for the caller of at least

`subtractedValue`.
