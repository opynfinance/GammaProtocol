# `PayableProxyController`

Contract for wrapping/unwrapping ETH before/after interacting with the Gamma Protocol

## Functions:

- `constructor(address _controller, address _marginPool, address payable _weth) (public)`

- `fallback() (external)`

- `operate(struct Actions.ActionArgs[] _actions, address payable _sendEthTo) (external)`

### Function `constructor(address _controller, address _marginPool, address payable _weth) public`

### Function `fallback() external`

fallback function which disallows ETH to be sent to this contract without data except when unwrapping WETH

### Function `operate(struct Actions.ActionArgs[] _actions, address payable _sendEthTo) external`

execute a number of actions

a wrapper for the Controller operate function, to wrap WETH and the beginning and unwrap WETH at the end of the execution

#### Parameters:

- `_actions`: array of actions arguments

- `_sendEthTo`: address to send the remaining eth to
