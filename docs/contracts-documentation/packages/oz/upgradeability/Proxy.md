## `Proxy`

Gives the possibility to delegate any call to a foreign implementation.

### `implementation() → address` (public)

Tells the address of the implementation where every call will be delegated.

### `fallback()` (external)

Fallback function allowing to perform a delegatecall to the given implementation.

This function will return whatever the implementation call returns
