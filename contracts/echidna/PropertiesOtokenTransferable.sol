/* SPDX-License-Identifier: UNLICENSED */
pragma solidity =0.6.10;

import "./CryticUtils.sol";
import "../Otoken.sol";

contract PropertiesOtokenTransferable is CryticUtils, Otoken {
    uint256 internal initialTotalSupply;
    uint256 internal initialBalance_owner;
    uint256 internal initialBalance_user;
    uint256 internal initialBalance_attacker;

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

    function echidna_always_empty() public returns (bool) {
        return this.balanceOf(address(0x0)) == 0;
    }

    function echidna_approve_overwrites() public returns (bool) {
        assert(approve(crytic_user, 20));
        assert(approve(crytic_user, 10));
        return this.allowance(msg.sender, crytic_user) == 10;
    }

    function echidna_less_than_total() public returns (bool) {
        return this.balanceOf(msg.sender) <= totalSupply();
    }

    function echidna_totalSupply_consistant() public returns (bool) {
        return
            this.balanceOf(crytic_owner) + this.balanceOf(crytic_user) + this.balanceOf(crytic_attacker) <=
            totalSupply();
    }

    function echidna_revert_transfer_to_zero() public returns (bool) {
        if (this.balanceOf(msg.sender) == 0) {
            revert();
        }
        return transfer(address(0x0), this.balanceOf(msg.sender));
    }

    function echidna_revert_transferFrom_to_zero() public returns (bool) {
        uint256 balance = this.balanceOf(msg.sender);
        if (balance == 0) {
            revert();
        }
        approve(msg.sender, balance);
        return transferFrom(msg.sender, address(0x0), this.balanceOf(msg.sender));
    }

    function echidna_self_transferFrom() public returns (bool) {
        uint256 balance = this.balanceOf(msg.sender);
        bool approve_return = approve(msg.sender, balance);
        bool transfer_return = transferFrom(msg.sender, msg.sender, balance);
        return (this.balanceOf(msg.sender) == balance) && approve_return && transfer_return;
    }

    function echidna_self_transferFrom_to_other() public returns (bool) {
        uint256 balance = this.balanceOf(msg.sender);
        bool approve_return = approve(msg.sender, balance);
        address other = crytic_user;
        if (other == msg.sender) {
            other = crytic_owner;
        }
        bool transfer_return = transferFrom(msg.sender, other, balance);
        return (this.balanceOf(msg.sender) == 0) && approve_return && transfer_return;
    }

    function echidna_self_transfer() public returns (bool) {
        uint256 balance = this.balanceOf(msg.sender);
        bool transfer_return = transfer(msg.sender, balance);
        return (this.balanceOf(msg.sender) == balance) && transfer_return;
    }

    function echidna_transfer_to_other() public returns (bool) {
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

    function echidna_revert_transfer_to_user() public returns (bool) {
        uint256 balance = this.balanceOf(msg.sender);
        if (balance == (2**256 - 1)) return true;
        bool transfer_other = transfer(crytic_user, balance + 1);
        return transfer_other;
    }
}
