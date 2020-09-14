/* SPDX-License-Identifier: UNLICENSED */
/* solhint-disable */
pragma solidity =0.6.10;
pragma experimental ABIEncoderV2;

import "../packages/oz/SafeMath.sol";
import "./EchidnaUtils.sol";
import "../Otoken.sol";
import "../AddressBook.sol";
import "../Whitelist.sol";
import "../OtokenFactory.sol";
import "../Controller.sol";
import "../mocks/MockERC20.sol";
import "../libs/Actions.sol";

/**
 * A protperty test wrapper around controller
 */
contract PropertyTests is EchidnaUtils {
    using SafeMath for uint256;

    AddressBook public addressBook;
    OtokenFactory public factory;
    Whitelist public whitelist;
    Controller public controller;

    Otoken[] public otokens;

    address[] public availableTokens;

    address[] public owners;
    mapping(address => bool) isOwner;

    constructor() public {
        addressBook = new AddressBook();
        Otoken otokenImplmentation = new Otoken();
        addressBook.setOtokenImpl(address(otokenImplmentation));

        factory = new OtokenFactory(address(addressBook));
        addressBook.setOtokenFactory(address(factory));

        whitelist = new Whitelist(address(addressBook));
        addressBook.setWhitelist(address(whitelist));

        // controller = new Controller();
        // controller.initialize(address(addressBook), address(this));
        // addressBook.setController(address(controller));
    }

    // /* Functions to be randomly called */

    /**
     * create and whitelist a new erc20 and whitelist to be collateral
     */
    function create_new_token() public {
        MockERC20 token = new MockERC20("Token", "T", 18);
        whitelist.whitelistCollateral(address(token));
        availableTokens.push(address(token));
    }

    /**
     * create new otoken
     */
    function create_new_otoken(uint256 _seed) public {
        uint256 expiry = _generateValidExpiry(_seed);
        bool isPut = _seed.mod(2) == 0;
        address underlying = availableTokens[_randomLessThan(availableTokens.length)];
        address strike = availableTokens[_randomLessThan(availableTokens.length)];
        address collateral = isPut ? strike : underlying;

        uint256 strikePrice = _seed;
        if (!whitelist.isWhitelistedProduct(underlying, strike, collateral, isPut)) {
            whitelist.whitelistProduct(underlying, strike, collateral, isPut);
        }
        address newOtoken = factory.createOtoken(underlying, strike, collateral, strikePrice, expiry, isPut);
        otokens.push(Otoken(newOtoken));
    }

    // /*
    //  * use this contract to create a new vault.
    //  */
    // function open_vault() public {
    //     uint256 id = this.getAccountVaultCounter(address(this)) + 1;
    //     Actions.ActionArgs[] memory args;
    //     args[0] = Actions.ActionArgs({
    //         actionType: Actions.ActionType.OpenVault,
    //         vaultId: id,
    //         owner: address(this),
    //         sender: address(0),
    //         asset: address(0),
    //         index: 0,
    //         amount: 0,
    //         data: new bytes(0)
    //     });
    //     this.operate(args);
    // }

    // function add_collateral(uint256 _amount) public {
    //     Otoken otoken = otokens[_randomLessThan(otokens.length)];
    //     address collateralType = otoken.collateralAsset();
    //     uint256 id = this.getAccountVaultCounter(address(this));
    //     Actions.ActionArgs[] memory args;
    //     args[0] = Actions.ActionArgs({
    //         actionType: Actions.ActionType.DepositCollateral,
    //         vaultId: id,
    //         owner: address(this),
    //         sender: address(this),
    //         asset: collateralType,
    //         index: 0,
    //         amount: _amount,
    //         data: new bytes(0)
    //     });
    //     this.operate(args);
    // }

    /* Properties */
    function echidna_no_eth_balance() public view returns (bool) {
        assert(address(addressBook).balance == 0);
        assert(address(whitelist).balance == 0);
        assert(address(factory).balance == 0);
        return true;
    }

    /* Util functions */
    function _generateValidExpiry(uint256 _random) internal pure returns (uint256) {
        uint256 smallerThanMaxExpiry = _random.mod(11865398400);
        uint256 remainder = smallerThanMaxExpiry.sub(28800).mod(86400);
        return smallerThanMaxExpiry - remainder;
    }

    function _randomLessThan(uint256 num) internal view returns (uint256) {
        return now.mod(num);
    }
}
