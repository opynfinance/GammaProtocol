# `TradeCallee`

callee contract to trade on 0x.

## Functions:

- `constructor(address _exchange, address _weth, address _controller) (public)`

- `callFunction(address payable _sender, bytes _data) (external)`

- `fallback() (external)`

### Function `constructor(address _exchange, address _weth, address _controller) public`

### Function `callFunction(address payable _sender, bytes _data) external`

fill 0x order

#### Parameters:

- `_sender`: the original sender who wants to trade on 0x

- `_data`: abi-encoded order, fillamount, signature and _sender. fee payer is the address we pull weth from.

### Function `fallback() external`

fallback function which allow ETH to be sent to this contract
