# `Proxy`

Gives the possibility to delegate any call to a foreign implementation.

## Functions:

- `implementation() (public)`

- `fallback() (external)`

### Function `implementation() → address public`

Tells the address of the implementation where every call will be delegated.

#### Return Values:

- address of the implementation to which it will be delegated

### Function `fallback() external`

Fallback function allowing to perform a delegatecall to the given implementation.

This function will return whatever the implementation call returns
