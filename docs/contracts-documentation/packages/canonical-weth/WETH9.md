A wrapper to use ETH as collateral

# Functions:

- [`receive()`]

- [`deposit()`]

- [`withdraw(uint256 _wad)`]

- [`totalSupply()`]

- [`approve(address _guy, uint256 _wad)`]

- [`transfer(address _dst, uint256 _wad)`]

- [`transferFrom(address _src, address _dst, uint256 _wad)`]

# Events:

- [`Approval(address src, address guy, uint256 wad)`]

- [`Transfer(address src, address dst, uint256 wad)`]

- [`Deposit(address dst, uint256 wad)`]

- [`Withdrawal(address src, uint256 wad)`]

# Function `receive()`

will get called in a tx with

# Function `deposit()`

No description

# Function `withdraw(uint256 _wad)`

Unwrap from WETH to ETH

## Parameters:

- `_wad`: amount WETH to unwrap and withdraw

# Function `totalSupply() → uint256`

No description

## Return Values:

- total supply

# Function `approve(address _guy, uint256 _wad) → bool`

No description

## Parameters:

- `_guy`: address to approve

- `_wad`: amount of WETH

## Return Values:

- true if tx succeeded

# Function `transfer(address _dst, uint256 _wad) → bool`

No description

## Parameters:

- `_dst`: destination address

- `_wad`: amount to transfer

## Return Values:

- true if tx succeeded

# Function `transferFrom(address _src, address _dst, uint256 _wad) → bool`

No description

## Parameters:

- `_src`: source address

- `_dst`: destination address

- `_wad`: amount to transfer

## Return Values:

- true if tx succeeded

# Event `Approval(address src, address guy, uint256 wad)`

No description

# Event `Transfer(address src, address dst, uint256 wad)`

No description

# Event `Deposit(address dst, uint256 wad)`

No description

# Event `Withdrawal(address src, uint256 wad)`

No description
