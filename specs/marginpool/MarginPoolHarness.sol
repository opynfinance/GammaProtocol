pragma solidity =0.6.10;

import {ERC20Interface} from './interfaces/ERC20Interface.sol';
import {AddressBookInterface} from './interfaces/AddressBookInterface.sol';
import {SafeMath} from './packages/oz/SafeMath.sol';
import {SafeERC20} from './packages/oz/SafeERC20.sol';
import {Ownable} from './packages/oz/Ownable.sol';

contract MarginPoolHarness is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for ERC20Interface;

  /// @notice AddressBook module
  address public addressBook;
  /// @dev the address that has the ability to withdraw excess assets in the pool
  address public farmer;
  /// @dev mapping between an asset and the amount of the asset in the pool
  mapping(address => uint256) internal assetBalance;
}
