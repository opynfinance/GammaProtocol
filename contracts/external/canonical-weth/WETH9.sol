// Copyright (C) 2015, 2016, 2017 Dapphub

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
// SPDX-License-Identifier:  GNU GPL
pragma solidity 0.6.10;

/**
 * @title WETH contract
 * @author Opyn Team
 * @dev A wrapper to use ETH as collateral
 */
contract WETH9 {
    string public name = "Wrapped Ether";
    string public symbol = "WETH";
    uint8 public decimals = 18;

    /// @notice emits an event when a sender approves WETH
    event Approval(address indexed src, address indexed guy, uint256 wad);
    /// @notice emits an event when a sender transfers WETH
    event Transfer(address indexed src, address indexed dst, uint256 wad);
    /// @notice emits an event when a sender deposits ETH into this contract
    event Deposit(address indexed dst, uint256 wad);
    /// @notice emits an event when a sender withdraws ETH from this contract
    event Withdrawal(address indexed src, uint256 wad);

    /// @notice mapping between address and WETH balance
    mapping(address => uint256) public balanceOf;
    /// @notice mapping between addresses and allowance amount
    mapping(address => mapping(address => uint256)) public allowance;

    /**
     * @notice fallback function that receives ETH
     * @dev will get called in a tx with ETH
     */
    receive() external payable {
        deposit();
    }

    /**
     * @notice wrap deposited ETH into WETH
     */
    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice withdraw ETH from contract
     * @dev Unwrap from WETH to ETH
     * @param _wad amount WETH to unwrap and withdraw
     */
    function withdraw(uint256 _wad) public {
        require(balanceOf[msg.sender] >= _wad, "WETH9: insufficient sender balance");
        balanceOf[msg.sender] -= _wad;
        msg.sender.transfer(_wad);
        emit Withdrawal(msg.sender, _wad);
    }

    /**
     * @notice get ETH total supply
     * @return total supply
     */
    function totalSupply() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice approve transfer
     * @param _guy address to approve
     * @param _wad amount of WETH
     * @return True if tx succeeds, False if not
     */
    function approve(address _guy, uint256 _wad) public returns (bool) {
        allowance[msg.sender][_guy] = _wad;
        emit Approval(msg.sender, _guy, _wad);
        return true;
    }

    /**
     * @notice transfer WETH
     * @param _dst destination address
     * @param _wad amount to transfer
     * @return True if tx succeeds, False if not
     */
    function transfer(address _dst, uint256 _wad) public returns (bool) {
        return transferFrom(msg.sender, _dst, _wad);
    }

    /**
     * @notice transfer from address
     * @param _src source address
     * @param _dst destination address
     * @param _wad amount to transfer
     * @return True if tx succeeds, False if not
     */
    function transferFrom(
        address _src,
        address _dst,
        uint256 _wad
    ) public returns (bool) {
        require(balanceOf[_src] >= _wad, "WETH9: insufficient source balance");

        if (_src != msg.sender && allowance[_src][msg.sender] != uint256(-1)) {
            require(allowance[_src][msg.sender] >= _wad, "WETH9: invalid allowance");
            allowance[_src][msg.sender] -= _wad;
        }

        balanceOf[_src] -= _wad;
        balanceOf[_dst] += _wad;

        emit Transfer(_src, _dst, _wad);

        return true;
    }
}
