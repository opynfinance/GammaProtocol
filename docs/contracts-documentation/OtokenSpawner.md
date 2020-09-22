## `OtokenSpawner`

This contract spawns and initializes eip-1167 minimal proxies that

point to existing logic contracts.

This contract was modified from Spawner.sol

https://github.com/0age/Spawner/blob/master/contracts/Spawner.sol to fit into OtokenFactory

### `_spawn(address logicContract, bytes initializationCalldata) → address` (internal)

Internal function for spawning an eip-1167 minimal proxy using `CREATE2`.

### `_computeAddress(address logicContract, bytes initializationCalldata) → address target` (internal)

Internal view function for finding the address of the standard

eip-1167 minimal proxy created using `CREATE2` with a given logic contract

and initialization calldata payload.
