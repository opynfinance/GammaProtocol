/* SPDX-License-Identifier: UNLICENSED */
/* solhint-disable */
pragma solidity =0.6.10;

import "./CryticUtils.sol";
// import "./EchidnaAddressBook.sol";
import "../Otoken.sol";
import "../mocks/MockAddressBook.sol";
import "../mocks/MockERC20.sol";
import "../interfaces/AddressBookInterface.sol";

contract OtokenERC20 is CryticUtils, Otoken {
    constructor() public {
        _initializeForFuzzer();
    }

    /**
     * Can't use the init function on otoken because it's external
     */
    function _initializeForFuzzer() internal initializer {
        MockAddressBook _addressBook = new MockAddressBook();
        _addressBook.setController(_fake_controller);

        address usdc = address(new MockERC20("USDC", "USDC", 6));
        address weth = address(new MockERC20("WETH", "WETH", 18));

        addressBook = address(_addressBook);
        underlyingAsset = usdc;
        strikeAsset = weth;
        collateralAsset = weth;
        strikePrice = 200 * 1e18;
        expiry = now + 100 days;
        isPut = true;
        (string memory tokenName, string memory tokenSymbol) = _getNameAndSymbol();
        __ERC20_init_unchained(tokenName, tokenSymbol);
    }

    function echidna_always_empty() public view returns (bool) {
        return this.balanceOf(address(0x0)) == 0;
    }

    function echidna_less_than_total() public view returns (bool) {
        assert(this.balanceOf(crytic_owner) <= totalSupply());
        assert(this.balanceOf(crytic_user) <= totalSupply());
        assert(this.balanceOf(crytic_attacker) <= totalSupply());
        return true;
    }
}
