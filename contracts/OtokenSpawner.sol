/* SPDX-License-Identifier: UNLICENSED */

pragma solidity =0.6.10;

import {Spawn} from "./packages/Spawn.sol";
import {Create2} from "./packages/oz/Create2.sol";

/**
 * @title OtokenSpawner
 * @author Opyn Team
 * @notice This contract spawns and initializes eip-1167 minimal proxies that
 * point to existing logic contracts.
 * @notice This contract was modified from Spawner.sol
 * https://github.com/0age/Spawner/blob/master/contracts/Spawner.sol to fit into OtokenFactory
 */
contract OtokenSpawner {
    // fixed salt value because we will only deploy an oToken with the same init value once
    bytes32 private constant SALT = bytes32(0);

    /**
     * @notice internal function for spawning an eip-1167 minimal proxy using `CREATE2`
     * @param logicContract address of the logic contract
     * @param initializationCalldata calldata that will be supplied to the `DELEGATECALL`
     * from the spawned contract to the logic contract during contract creation
     * @return spawnedContract the address of the newly-spawned contract
     */
    function _spawn(address logicContract, bytes memory initializationCalldata) internal returns (address) {
        // place the creation code and constructor args of the contract to spawn in memory
        bytes memory initCode = abi.encodePacked(
            type(Spawn).creationCode,
            abi.encode(logicContract, initializationCalldata)
        );

        // spawn the contract using `CREATE2`
        return Create2.deploy(0, SALT, initCode);
    }

    /**
     * @notice internal view function for finding the address of the standard
     * eip-1167 minimal proxy created using `CREATE2` with a given logic contract
     * and initialization calldata payload
     * @param logicContract address of the logic contract
     * @param initializationCalldata calldata that will be supplied to the `DELEGATECALL`
     * from the spawned contract to the logic contract during contract creation
     * @return target address of the next spawned minimal proxy contract with the
     * given parameters.
     */
    function _computeAddress(address logicContract, bytes memory initializationCalldata)
        internal
        view
        returns (address target)
    {
        // place the creation code and constructor args of the contract to spawn in memory
        bytes memory initCode = abi.encodePacked(
            type(Spawn).creationCode,
            abi.encode(logicContract, initializationCalldata)
        );
        // get target address using the constructed initialization code
        bytes32 initCodeHash = keccak256(initCode);

        target = Create2.computeAddress(SALT, initCodeHash);
    }
}
