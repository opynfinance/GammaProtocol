# `IERC20`

Interface of the ERC20 standard as defined in the EIP.

## Functions:

- `totalSupply() (external)`

- `balanceOf(address account) (external)`

- `transfer(address recipient, uint256 amount) (external)`

- `allowance(address owner, address spender) (external)`

- `approve(address spender, uint256 amount) (external)`

- `transferFrom(address sender, address recipient, uint256 amount) (external)`

## Events:

- `Transfer(address from, address to, uint256 value)`

- `Approval(address owner, address spender, uint256 value)`

### Function `totalSupply() → uint256 external`

Returns the amount of tokens in existence.

### Function `balanceOf(address account) → uint256 external`

Returns the amount of tokens owned by `account`.

### Function `transfer(address recipient, uint256 amount) → bool external`

Moves `amount` tokens from the caller's account to `recipient`.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event.

### Function `allowance(address owner, address spender) → uint256 external`

Returns the remaining number of tokens that `spender` will be

allowed to spend on behalf of `owner` through {transferFrom}. This is

zero by default.

This value changes when {approve} or {transferFrom} are called.

### Function `approve(address spender, uint256 amount) → bool external`

Sets `amount` as the allowance of `spender` over the caller's tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the risk

that someone may use both the old and the new allowance by unfortunate

transaction ordering. One possible solution to mitigate this race

condition is to first reduce the spender's allowance to 0 and set the

desired value afterwards:

https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event.

### Function `transferFrom(address sender, address recipient, uint256 amount) → bool external`

Moves `amount` tokens from `sender` to `recipient` using the

allowance mechanism. `amount` is then deducted from the caller's

allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event.

### Event `Transfer(address from, address to, uint256 value)`

Emitted when `value` tokens are moved from one account (`from`) to

another (`to`).

Note that `value` may be zero.

### Event `Approval(address owner, address spender, uint256 value)`

Emitted when the allowance of a `spender` for an `owner` is set by

a call to {approve}. `value` is the new allowance.
