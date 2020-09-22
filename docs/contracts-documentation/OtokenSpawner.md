# Functions:

- `_spawn(address logicContract, bytes initializationCalldata) (internal)`

- `_computeAddress(address logicContract, bytes initializationCalldata) (internal)`

# Function `_spawn(address logicContract, bytes initializationCalldata) → address` (internal)

Internal function for spawning an eip-1167 minimal proxy using `CREATE2`.

## Parameters:

- `logicContract`: address The address of the logic contract.

- `initializationCalldata`: bytes The calldata that will be supplied to

the `DELEGATECALL` from the spawned contract to the logic contract during

contract creation.

## Return Values:

- spawnedContract The address of the newly-spawned contract.

# Function `_computeAddress(address logicContract, bytes initializationCalldata) → address target` (internal)

Internal view function for finding the address of the standard

eip-1167 minimal proxy created using `CREATE2` with a given logic contract

and initialization calldata payload.

## Parameters:

- `logicContract`: address The address of the logic contract.

- `initializationCalldata`: bytes The calldata that will be supplied to

the `DELEGATECALL` from the spawned contract to the logic contract during

contract creation.

## Return Values:

- target The address of the next spawned minimal proxy contract with the

given parameters.
