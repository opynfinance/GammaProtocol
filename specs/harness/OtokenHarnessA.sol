pragma solidity ^0.6.0;
import '../../contracts/Otoken.sol';

contract OtokenHarnessA is Otoken {
  function havocTotalSupply(uint256 newVal) public {
    _totalSupply = newVal;
  }
}
