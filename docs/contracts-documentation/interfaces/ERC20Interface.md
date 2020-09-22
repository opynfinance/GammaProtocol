Interface of the ERC20 standard as defined in the EIP.

# Functions:

- [`totalSupply()`](#ERC20Interface-totalSupply--)

- [`balanceOf(address account)`](#ERC20Interface-balanceOf-address-)

- [`transfer(address recipient, uint256 amount)`](#ERC20Interface-transfer-address-uint256-)

- [`allowance(address owner, address spender)`](#ERC20Interface-allowance-address-address-)

- [`approve(address spender, uint256 amount)`](#ERC20Interface-approve-address-uint256-)

- [`transferFrom(address sender, address recipient, uint256 amount)`](#ERC20Interface-transferFrom-address-address-uint256-)

- [`decimals()`](#ERC20Interface-decimals--)

# Events:

- [`Transfer(address from, address to, uint256 value)`](#ERC20Interface-Transfer-address-address-uint256-)

- [`Approval(address owner, address spender, uint256 value)`](#ERC20Interface-Approval-address-address-uint256-)

# Function `totalSupply() → uint256` {#ERC20Interface-totalSupply--}

Returns the amount of tokens in existence.

# Function `balanceOf(address account) → uint256` {#ERC20Interface-balanceOf-address-}

Returns the amount of tokens owned by `account`.

# Function `transfer(address recipient, uint256 amount) → bool` {#ERC20Interface-transfer-address-uint256-}

Moves `amount` tokens from the caller's account to `recipient`.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event.

# Function `allowance(address owner, address spender) → uint256` {#ERC20Interface-allowance-address-address-}

Returns the remaining number of tokens that `spender` will be

allowed to spend on behalf of `owner` through {transferFrom}. This is

zero by default.

This value changes when {approve} or {transferFrom} are called.

# Function `approve(address spender, uint256 amount) → bool` {#ERC20Interface-approve-address-uint256-}

Sets `amount` as the allowance of `spender` over the caller's tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the risk

that someone may use both the old and the new allowance by unfortunate

transaction ordering. One possible solution to mitigate this race

condition is to first reduce the spender's allowance to 0 and set the

desired value afterwards:

https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event.

# Function `transferFrom(address sender, address recipient, uint256 amount) → bool` {#ERC20Interface-transferFrom-address-address-uint256-}

Moves `amount` tokens from `sender` to `recipient` using the

allowance mechanism. `amount` is then deducted from the caller's

allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event.

# Function `decimals() → uint8` {#ERC20Interface-decimals--}

No description

# Event `Transfer(address from, address to, uint256 value)` {#ERC20Interface-Transfer-address-address-uint256-}

Emitted when `value` tokens are moved from one account (`from`) to

another (`to`).

Note that `value` may be zero.

# Event `Approval(address owner, address spender, uint256 value)` {#ERC20Interface-Approval-address-address-uint256-}

Emitted when the allowance of a `spender` for an `owner` is set by

a call to {approve}. `value` is the new allowance.
