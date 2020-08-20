/* SPDX-License-Identifier: UNLICENSED */
pragma solidity =0.6.10;

import "./interfaces/CryticInterface.sol";
import "./TestOtoken.sol";

contract PropertiesOtokenTransferable is CryticInterface, TestOtoken {
    constructor() public {
        // Existing addresses:
        // - crytic_owner: If the contract has an owner, it must be crytic_owner
        // - crytic_user: Legitimate user
        // - crytic_attacker: Attacker
        //
        // Add below a minimal configuration:
        // - crytic_owner must have some tokens
        // - crytic_user must have some tokens
        // - crytic_attacker must have some tokens

        //
        //
        // Update the following if totalSupply and balanceOf are external functions or state variables:

        initialTotalSupply = totalSupply();
        initialBalance_owner = balanceOf(crytic_owner);
        initialBalance_user = balanceOf(crytic_user);
        initialBalance_attacker = balanceOf(crytic_attacker);
    }

    function crytic_zero_always_empty_ERC20Properties() public returns (bool) {
        return this.balanceOf(address(0x0)) == 0;
    }

    function crytic_approve_overwrites() public returns (bool) {
        bool approve_return;
        approve_return = approve(crytic_user, 10);
        require(approve_return);
        approve_return = approve(crytic_user, 20);
        require(approve_return);
        return this.allowance(msg.sender, crytic_user) == 20;
    }

    function crytic_less_than_total_ERC20Properties() public returns (bool) {
        return this.balanceOf(msg.sender) <= totalSupply();
    }

    function crytic_totalSupply_consistant_ERC20Properties() public returns (bool) {
        return
            this.balanceOf(crytic_owner) + this.balanceOf(crytic_user) + this.balanceOf(crytic_attacker) <=
            totalSupply();
    }

    function crytic_revert_transfer_to_zero_ERC20PropertiesTransferable() public returns (bool) {
        if (this.balanceOf(msg.sender) == 0) {
            revert();
        }
        return transfer(address(0x0), this.balanceOf(msg.sender));
    }

    function crytic_revert_transferFrom_to_zero_ERC20PropertiesTransferable() public returns (bool) {
        uint256 balance = this.balanceOf(msg.sender);
        if (balance == 0) {
            revert();
        }
        approve(msg.sender, balance);
        return transferFrom(msg.sender, address(0x0), this.balanceOf(msg.sender));
    }

    function crytic_self_transferFrom_ERC20PropertiesTransferable() public returns (bool) {
        uint256 balance = this.balanceOf(msg.sender);
        bool approve_return = approve(msg.sender, balance);
        bool transfer_return = transferFrom(msg.sender, msg.sender, balance);
        return (this.balanceOf(msg.sender) == balance) && approve_return && transfer_return;
    }

    function crytic_self_transferFrom_to_other_ERC20PropertiesTransferable() public returns (bool) {
        uint256 balance = this.balanceOf(msg.sender);
        bool approve_return = approve(msg.sender, balance);
        address other = crytic_user;
        if (other == msg.sender) {
            other = crytic_owner;
        }
        bool transfer_return = transferFrom(msg.sender, other, balance);
        return (this.balanceOf(msg.sender) == 0) && approve_return && transfer_return;
    }

    function crytic_self_transfer_ERC20PropertiesTransferable() public returns (bool) {
        uint256 balance = this.balanceOf(msg.sender);
        bool transfer_return = transfer(msg.sender, balance);
        return (this.balanceOf(msg.sender) == balance) && transfer_return;
    }

    function crytic_transfer_to_other_ERC20PropertiesTransferable() public returns (bool) {
        uint256 balance = this.balanceOf(msg.sender);
        address other = crytic_user;
        if (other == msg.sender) {
            other = crytic_owner;
        }
        if (balance >= 1) {
            bool transfer_other = transfer(other, 1);
            return (this.balanceOf(msg.sender) == balance - 1) && (this.balanceOf(other) >= 1) && transfer_other;
        }
        return true;
    }

    function crytic_revert_transfer_to_user_ERC20PropertiesTransferable() public returns (bool) {
        uint256 balance = this.balanceOf(msg.sender);
        if (balance == (2**256 - 1)) return true;
        bool transfer_other = transfer(crytic_user, balance + 1);
        return transfer_other;
    }
}
