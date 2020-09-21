A wrapper to use ETH as collateral

# Functions:

- [`receive()`](#WETH9-receive--)

- [`deposit()`](#WETH9-deposit--)

- [`withdraw(uint256 _wad)`](#WETH9-withdraw-uint256-)

- [`totalSupply()`](#WETH9-totalSupply--)

- [`approve(address _guy, uint256 _wad)`](#WETH9-approve-address-uint256-)

- [`transfer(address _dst, uint256 _wad)`](#WETH9-transfer-address-uint256-)

- [`transferFrom(address _src, address _dst, uint256 _wad)`](#WETH9-transferFrom-address-address-uint256-)

# Events:

- [`Approval(address src, address guy, uint256 wad)`](#WETH9-Approval-address-address-uint256-)

- [`Transfer(address src, address dst, uint256 wad)`](#WETH9-Transfer-address-address-uint256-)

- [`Deposit(address dst, uint256 wad)`](#WETH9-Deposit-address-uint256-)

- [`Withdrawal(address src, uint256 wad)`](#WETH9-Withdrawal-address-uint256-)

# Function `receive()` {#WETH9-receive--}

will get called in a tx with

# Function `deposit()` {#WETH9-deposit--}

No description

# Function `withdraw(uint256 _wad)` {#WETH9-withdraw-uint256-}

Unwrap from WETH to ETH

## Parameters:

- `_wad`: amount WETH to unwrap and withdraw

# Function `totalSupply() → uint256` {#WETH9-totalSupply--}

No description

## Return Values:

- total supply

# Function `approve(address _guy, uint256 _wad) → bool` {#WETH9-approve-address-uint256-}

No description

## Parameters:

- `_guy`: address to approve

- `_wad`: amount of WETH

## Return Values:

- true if tx succeeded

# Function `transfer(address _dst, uint256 _wad) → bool` {#WETH9-transfer-address-uint256-}

No description

## Parameters:

- `_dst`: destination address

- `_wad`: amount to transfer

## Return Values:

- true if tx succeeded

# Function `transferFrom(address _src, address _dst, uint256 _wad) → bool` {#WETH9-transferFrom-address-address-uint256-}

No description

## Parameters:

- `_src`: source address

- `_dst`: destination address

- `_wad`: amount to transfer

## Return Values:

- true if tx succeeded

# Event `Approval(address src, address guy, uint256 wad)` {#WETH9-Approval-address-address-uint256-}

No description

# Event `Transfer(address src, address dst, uint256 wad)` {#WETH9-Transfer-address-address-uint256-}

No description

# Event `Deposit(address dst, uint256 wad)` {#WETH9-Deposit-address-uint256-}

No description

# Event `Withdrawal(address src, uint256 wad)` {#WETH9-Withdrawal-address-uint256-}

No description
