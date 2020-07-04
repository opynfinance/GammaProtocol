pragma solidity ^0.6.0;

/**
 * @title Spawn
 * @author 0age
 * @notice This contract provides creation code that is used by Spawner in order
 * to initialize and deploy eip-1167 minimal proxies for a given logic contract.
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
 * @title SpawnCompact
 * @author 0age
 * @notice This contract provides creation code that is used by Spawner in order
 * to initialize and deploy eip-1167 minimal proxies for a given logic contract.
 * It expects the address of the logic contract to begin with at least five zero
 * bytes.
 */
contract SpawnCompact {
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
            bytes10(0x363d3d373d3d3d363d6e),
            uint120(uint160(logicContract)),
            bytes15(0x5af43d82803e903d91602b57fd5bf3)
        );

        // return eip-1167 code to write it to spawned contract runtime.
        assembly {
            return(add(0x20, runtimeCode), 40) // eip-1167 runtime code, length
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
 */
contract Spawner {
    /**
     * @notice Internal function for spawning an eip-1167 minimal proxy using
     * `CREATE2`.
     * @param logicContract address The address of the logic contract.
     * @param initializationCalldata bytes The calldata that will be supplied to
     * the `DELEGATECALL` from the spawned contract to the logic contract during
     * contract creation.
     * @return The address of the newly-spawned contract.
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
     * @notice Internal function for spawning a compact eip-1167 minimal proxy
     * using `CREATE2`. This method will save ~1000 gas per deployment, but requires
     * that the logic contract has a contract address that begins with at least
     * five zero bytes.
     * @param compactLogicContract address The address of the logic contract. It
     * must begin with at least five zero bytes, or ten zeroes.
     * @param initializationCalldata bytes The calldata that will be supplied to
     * the `DELEGATECALL` from the spawned contract to the logic contract during
     * contract creation.
     * @return The address of the newly-spawned contract.
     */
    function _spawnCompact(address compactLogicContract, bytes memory initializationCalldata)
        internal
        returns (address spawnedContract)
    {
        // ensure that the address is sufficiently compact.
        _ensureCompact(compactLogicContract);

        // place creation code and constructor args of contract to spawn in memory.
        bytes memory initCode = abi.encodePacked(
            type(SpawnCompact).creationCode,
            abi.encode(compactLogicContract, initializationCalldata)
        );

        // spawn the contract using `CREATE2`.
        spawnedContract = _spawnCreate2(initCode);
    }

    /**
     * @notice Internal function for spawning an eip-1167 minimal proxy using
     * `CREATE`. This method will be slightly cheaper than standard _spawn in
     * cases where counterfactual address derivation is not required.
     * @param logicContract address The address of the logic contract.
     * @param initializationCalldata bytes The calldata that will be supplied to
     * the `DELEGATECALL` from the spawned contract to the logic contract during
     * contract creation.
     * @return The address of the newly-spawned contract.
     */
    function _spawnOldSchool(address logicContract, bytes memory initializationCalldata)
        internal
        returns (address spawnedContract)
    {
        // place creation code and constructor args of contract to spawn in memory.
        bytes memory initCode = abi.encodePacked(
            type(Spawn).creationCode,
            abi.encode(logicContract, initializationCalldata)
        );

        // spawn the contract using `CREATE`.
        spawnedContract = _spawnCreate(initCode);
    }

    /**
     * @notice Internal function for spawning a compact eip-1167 minimal proxy
     * using `CREATE`. This method will save the most gas per deployment, but
     * requires that the logic contract has a contract address that begins with at
     * least five zero bytes and will not be viable in cases where counterfactual
     * address derivation is not required.
     * @param compactLogicContract address The address of the logic contract. It
     * must begin with at least five zero bytes, or ten zeroes.
     * @param initializationCalldata bytes The calldata that will be supplied to
     * the `DELEGATECALL` from the spawned contract to the logic contract during
     * contract creation.
     * @return The address of the newly-spawned contract.
     */
    function _spawnCompactOldSchool(address compactLogicContract, bytes memory initializationCalldata)
        internal
        returns (address spawnedContract)
    {
        // ensure that the address is sufficiently compact.
        _ensureCompact(compactLogicContract);

        // place creation code and constructor args of contract to spawn in memory.
        bytes memory initCode = abi.encodePacked(
            type(SpawnCompact).creationCode,
            abi.encode(compactLogicContract, initializationCalldata)
        );

        // spawn the contract using `CREATE`.
        spawnedContract = _spawnCreate(initCode);
    }

    /**
     * @notice Internal view function for finding the address of the next standard
     * eip-1167 minimal proxy created using `CREATE2` with a given logic contract
     * and initialization calldata payload.
     * @param logicContract address The address of the logic contract.
     * @param initializationCalldata bytes The calldata that will be supplied to
     * the `DELEGATECALL` from the spawned contract to the logic contract during
     * contract creation.
     * @return The address of the next spawned minimal proxy contract with the
     * given parameters.
     */
    function _computeNextAddress(address logicContract, bytes memory initializationCalldata)
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
        (, target) = _getSaltAndTarget(initCode);
    }

    /**
     * @notice Internal view function for finding the address of the next compact
     * eip-1167 minimal proxy created using `CREATE2` with a given logic contract
     * and initialization calldata payload.
     * @param compactLogicContract address The address of the logic contract. It
     * must begin with at least five zero bytes, or ten zeroes.
     * @param initializationCalldata bytes The calldata that will be supplied to
     * the `DELEGATECALL` from the spawned contract to the logic contract during
     * contract creation.
     * @return The address of the next spawned compact minimal proxy contract with
     * the given parameters.
     */
    function _computeNextCompactAddress(address compactLogicContract, bytes memory initializationCalldata)
        internal
        view
        returns (address target)
    {
        // ensure that the address is sufficiently compact.
        _ensureCompact(compactLogicContract);

        // place creation code and constructor args of contract to spawn in memory.
        bytes memory initCode = abi.encodePacked(
            type(SpawnCompact).creationCode,
            abi.encode(compactLogicContract, initializationCalldata)
        );

        // get target address using the constructed initialization code.
        (, target) = _getSaltAndTarget(initCode);
    }

    /**
     * @notice Private function for spawning a compact eip-1167 minimal proxy
     * using `CREATE`. Provides logic that is reused by internal functions.
     * @param initCode bytes The contract creation code.
     * @return The address of the newly-spawned contract.
     */
    function _spawnCreate(bytes memory initCode) private returns (address spawnedContract) {
        assembly {
            let encoded_data := add(0x20, initCode) // load initialization code.
            let encoded_size := mload(initCode) // load the init code's length.
            spawnedContract := create(
                // call `CREATE` with 3 arguments.
                callvalue(), // forward any supplied endowment.
                encoded_data, // pass in initialization code.
                encoded_size // pass in init code's length.
            )

            // pass along failure message from failed contract deployment and revert.
            if iszero(spawnedContract) {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }

    /**
     * @notice Private function for spawning a compact eip-1167 minimal proxy
     * using `CREATE2`. Provides logic that is reused by internal functions. A
     * salt will also be chosen based on the calling address and a computed nonce
     * that prevents deployments to existing addresses.
     * @param initCode bytes The contract creation code.
     * @return The address of the newly-spawned contract.
     */
    function _spawnCreate2(bytes memory initCode) private returns (address spawnedContract) {
        // get salt to use during deployment using the supplied initialization code.
        (bytes32 salt, ) = _getSaltAndTarget(initCode);

        assembly {
            let encoded_data := add(0x20, initCode) // load initialization code.
            let encoded_size := mload(initCode) // load the init code's length.
            spawnedContract := create2(
                // call `CREATE2` w/ 4 arguments.
                callvalue(), // forward any supplied endowment.
                encoded_data, // pass in initialization code.
                encoded_size, // pass in init code's length.
                salt // pass in the salt value.
            )

            // pass along failure message from failed contract deployment and revert.
            if iszero(spawnedContract) {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }

    /**
     * @notice Private function for determining the salt and the target deployment
     * address for the next spawned contract (using create2) based on the contract
     * creation code.
     */
    function _getSaltAndTarget(bytes memory initCode) private view returns (bytes32 salt, address target) {
        // get the keccak256 hash of the init code for address derivation.
        bytes32 initCodeHash = keccak256(initCode);

        // set the initial nonce to be provided when constructing the salt.
        uint256 nonce = 0;

        // declare variable for code size of derived address.
        uint256 codeSize;

        while (true) {
            // derive `CREATE2` salt using `msg.sender` and nonce.
            salt = keccak256(abi.encodePacked(msg.sender, nonce));

            target = address( // derive the target deployment address.
                uint160( // downcast to match the address type.
                    uint256( // cast to uint to truncate upper digits.
                        keccak256( // compute CREATE2 hash using 4 inputs.
                            abi.encodePacked( // pack all inputs to the hash together.
                                bytes1(0xff), // pass in the control character.
                                address(this), // pass in the address of this contract.
                                salt, // pass in the salt from above.
                                initCodeHash // pass in hash of contract creation code.
                            )
                        )
                    )
                )
            );

            // determine if a contract is already deployed to the target address.
            assembly {
                codeSize := extcodesize(target)
            }

            // exit the loop if no contract is deployed to the target address.
            if (codeSize == 0) {
                break;
            }

            // otherwise, increment the nonce and derive a new salt.
            nonce++;
        }
    }

    /**
     * @notice Private function for ensuring that a compact logic contract address
     * is supplied. Provides logic that is reused by internal functions.
     * @param logicContract address The address of the logic contract.
     */
    function _ensureCompact(address logicContract) private pure {
        // ensure that the address is sufficiently compact.
        require(
            uint160(logicContract) <= 0xffffffffffffffffffffffffffffff,
            "Logic contract address must start with at least five zero bytes."
        );
    }
}
