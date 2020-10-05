# `OtokenSpawner`

This contract spawns and initializes eip-1167 minimal proxies that

point to existing logic contracts.

This contract was modified from Spawner.sol

https://github.com/0age/Spawner/blob/master/contracts/Spawner.sol to fit into OtokenFactory

## Functions:

- `_spawn(address logicContract, bytes initializationCalldata) (internal)`

- `_computeAddress(address logicContract, bytes initializationCalldata) (internal)`

### Function `_spawn(address logicContract, bytes initializationCalldata) → address internal`

internal function for spawning an eip-1167 minimal proxy using `CREATE2`

#### Parameters:

- `logicContract`: address of the logic contract

- `initializationCalldata`: calldata that will be supplied to the `DELEGATECALL`

from the spawned contract to the logic contract during contract creation

#### Return Values:

- spawnedContract the address of the newly-spawned contract

### Function `_computeAddress(address logicContract, bytes initializationCalldata) → address target internal`

internal view function for finding the address of the standard

eip-1167 minimal proxy created using `CREATE2` with a given logic contract

and initialization calldata payload

#### Parameters:

- `logicContract`: address of the logic contract

- `initializationCalldata`: calldata that will be supplied to the `DELEGATECALL`

from the spawned contract to the logic contract during contract creation

#### Return Values:

- target address of the next spawned minimal proxy contract with the

given parameters.
