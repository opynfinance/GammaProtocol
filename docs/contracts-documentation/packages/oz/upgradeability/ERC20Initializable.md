Implementation of the {IERC20} interface.

# Functions:

- [`name()`](#ERC20Initializable-name--)

- [`symbol()`](#ERC20Initializable-symbol--)

- [`decimals()`](#ERC20Initializable-decimals--)

- [`totalSupply()`](#ERC20Initializable-totalSupply--)

- [`balanceOf(address account)`](#ERC20Initializable-balanceOf-address-)

- [`transfer(address recipient, uint256 amount)`](#ERC20Initializable-transfer-address-uint256-)

- [`allowance(address owner, address spender)`](#ERC20Initializable-allowance-address-address-)

- [`approve(address spender, uint256 amount)`](#ERC20Initializable-approve-address-uint256-)

- [`transferFrom(address sender, address recipient, uint256 amount)`](#ERC20Initializable-transferFrom-address-address-uint256-)

- [`increaseAllowance(address spender, uint256 addedValue)`](#ERC20Initializable-increaseAllowance-address-uint256-)

- [`decreaseAllowance(address spender, uint256 subtractedValue)`](#ERC20Initializable-decreaseAllowance-address-uint256-)

# Function `name() → string` {#ERC20Initializable-name--}

Returns the name of the token.

# Function `symbol() → string` {#ERC20Initializable-symbol--}

Returns the symbol of the token, usually a shorter version of the

name.

# Function `decimals() → uint8` {#ERC20Initializable-decimals--}

Returns the number of decimals used to get its user representation.

For example, if `decimals` equals `2`, a balance of `505` tokens should

be displayed to a user as `5,05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between

Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is

called.

NOTE: This information is only used for _display_ purposes: it in

no way affects any of the arithmetic of the contract, including

{IERC20-balanceOf} and {IERC20-transfer}.

# Function `totalSupply() → uint256` {#ERC20Initializable-totalSupply--}

See {IERC20-totalSupply}.

# Function `balanceOf(address account) → uint256` {#ERC20Initializable-balanceOf-address-}

See {IERC20-balanceOf}.

# Function `transfer(address recipient, uint256 amount) → bool` {#ERC20Initializable-transfer-address-uint256-}

See {IERC20-transfer}.

Requirements:

- `recipient` cannot be the zero address.

- the caller must have a balance of at least `amount`.

# Function `allowance(address owner, address spender) → uint256` {#ERC20Initializable-allowance-address-address-}

See {IERC20-allowance}.

# Function `approve(address spender, uint256 amount) → bool` {#ERC20Initializable-approve-address-uint256-}

See {IERC20-approve}.

Requirements:

- `spender` cannot be the zero address.

# Function `transferFrom(address sender, address recipient, uint256 amount) → bool` {#ERC20Initializable-transferFrom-address-address-uint256-}

See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not

required by the EIP. See the note at the beginning of {ERC20};

Requirements:

- `sender` and `recipient` cannot be the zero address.

- `sender` must have a balance of at least `amount`.

- the caller must have allowance for ``sender``'s tokens of at least

`amount`.

# Function `increaseAllowance(address spender, uint256 addedValue) → bool` {#ERC20Initializable-increaseAllowance-address-uint256-}

Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for

problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.

# Function `decreaseAllowance(address spender, uint256 subtractedValue) → bool` {#ERC20Initializable-decreaseAllowance-address-uint256-}

Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for

problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.

- `spender` must have allowance for the caller of at least

`subtractedValue`.
