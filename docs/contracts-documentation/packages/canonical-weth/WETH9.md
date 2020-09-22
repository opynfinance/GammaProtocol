# `WETH9`

A wrapper to use ETH as collateral

## Functions:

- `receive() (external)`

- `deposit() (public)`

- `withdraw(uint256 _wad) (public)`

- `totalSupply() (public)`

- `approve(address _guy, uint256 _wad) (public)`

- `transfer(address _dst, uint256 _wad) (public)`

- `transferFrom(address _src, address _dst, uint256 _wad) (public)`

## Events:

- `Approval(address src, address guy, uint256 wad)`

- `Transfer(address src, address dst, uint256 wad)`

- `Deposit(address dst, uint256 wad)`

- `Withdrawal(address src, uint256 wad)`

### Function `receive() external`

fallback function that receive ETH

will get called in a tx with

### Function `deposit() public`

Wrap deposited ETH into WETH

### Function `withdraw(uint256 _wad) public`

withdraw ETH from contract

Unwrap from WETH to ETH

#### Parameters:

- `_wad`: amount WETH to unwrap and withdraw

### Function `totalSupply() → uint256 public`

get ETH total supply

#### Return Values:

- total supply

### Function `approve(address _guy, uint256 _wad) → bool public`

approve transfer

#### Parameters:

- `_guy`: address to approve

- `_wad`: amount of WETH

#### Return Values:

- true if tx succeeded

### Function `transfer(address _dst, uint256 _wad) → bool public`

transfer WETH

#### Parameters:

- `_dst`: destination address

- `_wad`: amount to transfer

#### Return Values:

- true if tx succeeded

### Function `transferFrom(address _src, address _dst, uint256 _wad) → bool public`

transfer from address

#### Parameters:

- `_src`: source address

- `_dst`: destination address

- `_wad`: amount to transfer

#### Return Values:

- true if tx succeeded

### Event `Approval(address src, address guy, uint256 wad)`

emmitted when a sender approve WETH transfer

### Event `Transfer(address src, address dst, uint256 wad)`

emmitted when a sender transfer WETH

### Event `Deposit(address dst, uint256 wad)`

emitted when a sender deposit ETH into this contract

### Event `Withdrawal(address src, uint256 wad)`

emmited when a sender withdraw ETH from this contract
