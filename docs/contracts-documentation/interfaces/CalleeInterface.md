# `CalleeInterface`

Contract interface that can be called from Controller as a call action.

## Functions:

- `callFunction(address payable _sender, address _vaultOwner, uint256 _vaultId, bytes _data) (external)`

### Function `callFunction(address payable _sender, address _vaultOwner, uint256 _vaultId, bytes _data)` (external)

Allows users to send this contract arbitrary data.

#### Parameters:

- `_sender`: The msg.sender to Controller

- `_vaultOwner`: The vault owner

- `_vaultId`: The vault id

- `_data`: Arbitrary data given by the sender
