## `WETH9`

A wrapper to use ETH as collateral

### `receive()` (external)

fallback function that receive ETH

will get called in a tx with

### `deposit()` (public)

Wrap deposited ETH into WETH

### `withdraw(uint256 _wad)` (public)

withdraw ETH from contract

Unwrap from WETH to ETH

### `totalSupply() → uint256` (public)

get ETH total supply

### `approve(address _guy, uint256 _wad) → bool` (public)

approve transfer

### `transfer(address _dst, uint256 _wad) → bool` (public)

transfer WETH

### `transferFrom(address _src, address _dst, uint256 _wad) → bool` (public)

transfer from address

### `Approval(address src, address guy, uint256 wad)`

emmitted when a sender approve WETH transfer

### `Transfer(address src, address dst, uint256 wad)`

emmitted when a sender transfer WETH

### `Deposit(address dst, uint256 wad)`

emitted when a sender deposit ETH into this contract

### `Withdrawal(address src, uint256 wad)`

emmited when a sender withdraw ETH from this contract
