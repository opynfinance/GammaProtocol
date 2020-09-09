// SPDX-License-Identifier: MIT
/* solhint-disable */
pragma solidity ^0.6.0;

import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * ERC20 Token that return false when operation failed
 */
contract MockDumbERC20 {
    using SafeMath for uint256;

    bool internal _locked;

    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) public {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public virtual returns (bool) {
        if (_locked) return false;
        if (_balances[msg.sender] < amount) {
            return false;
        }
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(amount);
        return true;
    }

    function allowance(address owner, address spender) public virtual view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public virtual returns (bool) {
        _allowances[msg.sender][spender] = _allowances[msg.sender][spender].add(amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual returns (bool) {
        if (_locked) return false;
        if (_balances[sender] < amount) {
            return false;
        }
        if (_allowances[sender][msg.sender] < amount) {
            return false;
        }
        _allowances[sender][msg.sender] = _allowances[sender][msg.sender].sub(amount);
        _balances[sender] = _balances[sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(amount);
        return true;
    }

    function mint(address recipient, uint256 amount) public {
        _balances[recipient] = _balances[recipient].add(amount);
    }

    function burn(address recipient, uint256 amount) public {
        _balances[recipient] = _balances[recipient].sub(amount);
    }

    function setLocked(bool locked_) public {
        _locked = locked_;
    }
}
