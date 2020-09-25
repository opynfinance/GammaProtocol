# `Create2`

Helper to make usage of the `CREATE2` EVM opcode easier and safer.

`CREATE2` can be used to compute in advance the address where a smart

contract will be deployed, which allows for interesting new mechanisms known

as 'counterfactual interactions'.

See the https://eips.ethereum.org/EIPS/eip-1014#motivation[EIP] for more

information.

## Functions:

- `deploy(uint256 amount, bytes32 salt, bytes bytecode) (internal)`

- `computeAddress(bytes32 salt, bytes32 bytecodeHash) (internal)`

- `computeAddress(bytes32 salt, bytes32 bytecodeHash, address deployer) (internal)`

### Function `deploy(uint256 amount, bytes32 salt, bytes bytecode) → address internal`

Deploys a contract using `CREATE2`. The address where the contract

will be deployed can be known in advance via {computeAddress}.

The bytecode for a contract can be obtained from Solidity with

`type(contractName).creationCode`.

Requirements:

- `bytecode` must not be empty.

- `salt` must have not been used for `bytecode` already.

- the factory must have a balance of at least `amount`.

- if `amount` is non-zero, `bytecode` must have a `payable` constructor.

### Function `computeAddress(bytes32 salt, bytes32 bytecodeHash) → address internal`

Returns the address where a contract will be stored if deployed via {deploy}. Any change in the

`bytecodeHash` or `salt` will result in a new destination address.

### Function `computeAddress(bytes32 salt, bytes32 bytecodeHash, address deployer) → address internal`

Returns the address where a contract will be stored if deployed via {deploy} from a contract located at

`deployer`. If `deployer` is this contract's address, returns the same value as {computeAddress}.
