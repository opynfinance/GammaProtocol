pragma solidity 0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./mocks/AddressBookMock.sol";

/**
 * @author Opyn Team
 * @title Whitelist Module
 * @notice The whitelist module keeps track of all valid Otoken contracts.
 */
contract Whitelist is Ownable {
    // TODO: change this to addressBook contract
    AddressBookMock internal addressBook;

    mapping(bytes32 => bool) internal isSupportedProduct;
    mapping(address => bool) public isValidOtoken;

    modifier isFactory(address _contract) {
        require(_contract == addressBook.getOtokenFactory(), "Sender is not OtokenFactory");

        _;
    }

    constructor(address _addresBook) public {
        require(_addresBook != address(0), "Invalid AddressBook");

        addressBook = AddressBookMock(_addresBook);
    }

    function whitelistProduct(
        address _underlying,
        address _collateral,
        address _strike
    ) external onlyOwner returns (byte32 id) {
        bytes32 productHash = keccak256(_underlying, _collateral, _strike);

        _setIsSupportedProduct(productHash);
    }

    function _setIsSupportedProduct(bytes32 _productHash) internal {
        require(isSupportedProduct[_productHash] == false, "Product already supported");

        isSupportedProduct[_productHash] = true;
    }
}
