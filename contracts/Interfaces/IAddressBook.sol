pragma solidity 0.6.0;

import {IWhitelistModule} from "./IWhitelistModule.sol";
import {IOtoken} from "./IOtoken.sol";

interface IAddressBook {
    function getOtokenImpl() external view returns (IOtoken otoken);

    function getWhitelist() external view returns (IWhitelistModule whitelist);
}
