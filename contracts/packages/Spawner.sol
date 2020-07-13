/* solhint-disable avoid-low-level-calls, indent, no-inline-assembly */
pragma solidity =0.6.10;

/**
 * @title Spawn
 * @author 0age
 * @notice This contract provides creation code that is used by Spawner in order
 * to initialize and deploy eip-1167 minimal proxies for a given logic contract.
 * SPDX-License-Identifier: UNLICENSED
 */
contract Spawn {
    constructor(address logicContract, bytes memory initializationCalldata) public payable {
        // delegatecall into the logic contract to perform initialization.
        (bool ok, ) = logicContract.delegatecall(initializationCalldata);
        if (!ok) {
            // pass along failure message from delegatecall and revert.
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }

        // place eip-1167 runtime code in memory.
        bytes memory runtimeCode = abi.encodePacked(
            bytes10(0x363d3d373d3d3d363d73),
            logicContract,
            bytes15(0x5af43d82803e903d91602b57fd5bf3)
        );

        // return eip-1167 code to write it to spawned contract runtime.
        assembly {
            return(add(0x20, runtimeCode), 45) // eip-1167 runtime code, length
        }
    }
}

/**
 * @title Spawner
 * @author 0age
 * @notice This contract spawns and initializes eip-1167 minimal proxies that
 * point to existing logic contracts. The logic contracts need to have an
 * intitializer function that should only callable when no contract exists at
 * their current address (i.e. it is being `DELEGATECALL`ed from a constructor).
 * @notice This contract has been updated by Anton Cheng as follow:
 * Remove for loop in _computeAddress because we expect contract with same initData
 * to only be deployed once with the factory
 */
contract Spawner {
    // Have a fixed salt value because we will only deploy oToken with same init value once.
    bytes32 private constant SALT = 0;

    /**
     * @notice Internal function for spawning an eip-1167 minimal proxy using
     * `CREATE2`.
     * @param logicContract address The address of the logic contract.
     * @param initializationCalldata bytes The calldata that will be supplied to
     * the `DELEGATECALL` from the spawned contract to the logic contract during
     * contract creation.
     * @return spawnedContract The address of the newly-spawned contract.
     */
    function _spawn(address logicContract, bytes memory initializationCalldata)
        internal
        returns (address spawnedContract)
    {
        // place creation code and constructor args of contract to spawn in memory.
        bytes memory initCode = abi.encodePacked(
            type(Spawn).creationCode,
            abi.encode(logicContract, initializationCalldata)
        );

        // spawn the contract using `CREATE2`.
        spawnedContract = _spawnCreate2(initCode);
    }

    /**
     * @notice Internal view function for finding the address of the standard
     * eip-1167 minimal proxy created using `CREATE2` with a given logic contract
     * and initialization calldata payload.
     * @param logicContract address The address of the logic contract.
     * @param initializationCalldata bytes The calldata that will be supplied to
     * the `DELEGATECALL` from the spawned contract to the logic contract during
     * contract creation.
     * @return target The address of the next spawned minimal proxy contract with the
     * given parameters.
     */
    function _computeAddress(address logicContract, bytes memory initializationCalldata)
        internal
        view
        returns (address target)
    {
        // place creation code and constructor args of contract to spawn in memory.
        bytes memory initCode = abi.encodePacked(
            type(Spawn).creationCode,
            abi.encode(logicContract, initializationCalldata)
        );
        // get target address using the constructed initialization code.
        bytes32 initCodeHash = keccak256(initCode);

        bytes32 _data = keccak256( // compute CREATE2 hash using 4 inputs.
            abi.encodePacked(
                bytes1(0xff), // pass in the control character.
                address(this), // pass in the address of this contract.
                SALT, // pass in the salt from above.
                initCodeHash // pass in hash of contract creation code.
            )
        );
        target = address(uint256(_data));
    }

    /**
     * @notice Private function for spawning a compact eip-1167 minimal proxy
     * using `CREATE2`. Provides logic that is reused by internal functions. A
     * salt will also be chosen based on the calling address and a computed nonce
     * that prevents deployments to existing addresses.
     * @param initCode bytes The contract creation code.
     * @return spawnedContract The address of the newly-spawned contract.
     */
    function _spawnCreate2(bytes memory initCode) private returns (address spawnedContract) {
        assembly {
            let encoded_data := add(0x20, initCode) // load initialization code.
            let encoded_size := mload(initCode) // load the init code's length.
            spawnedContract := create2(
                callvalue(), // forward any supplied endowment.
                encoded_data, // pass in initialization code.
                encoded_size, // pass in init code's length.
                SALT // pass in the salt value.
            )

            // pass along failure message from failed contract deployment and revert.
            if iszero(spawnedContract) {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }
}
