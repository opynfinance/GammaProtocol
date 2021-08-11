// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {ERC20Upgradeable} from "../packages/oz/upgradeability/ERC20Upgradeable.sol";

contract MockSTETHToken is ERC20Upgradeable {
    mapping(uint256 => uint256) public getPooledEthByShares;

    constructor(string memory _name, string memory _symbol) public {
        __ERC20_init_unchained(_name, _symbol);
        _setupDecimals(18);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function setPooledEthByShares(uint256 _pooledEthByShares) external {
        getPooledEthByShares[1 ether] = _pooledEthByShares;
    }
}
