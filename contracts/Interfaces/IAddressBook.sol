pragma solidity 0.6.0;

import {IWhitelistModule} from "./IWhitelistModule.sol";
import {IOtoken} from "./IOtoken.sol";
import {IMarginPool} from "./IMarginPool.sol";

interface IAddressBook {
    function getOtokenImpl() external view returns (IOtoken otoken);

    function getWhitelist() external view returns (IWhitelistModule whitelist);

    function getMarginPool() external view returns (IMarginPool pool);
}
