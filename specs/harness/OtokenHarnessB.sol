pragma solidity ^0.6.0;
import '../../contracts/Otoken.sol';

contract OtokenHarnessB is Otoken {
  function havocTotalSupply(uint256 newVal) public {
    _totalSupply = newVal;
  }
}
