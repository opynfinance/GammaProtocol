pragma solidity 0.6.10;

/**
 * @author Opyn Team
 * @title AddressBook Module Mock
 */
contract AddressBookMock {
    address internal otokenFactory;

    constructor(address _otokenFactory) public {
        otokenFactory = _otokenFactory;
    }

    function getOtokenFactory() external view returns (address) {
        return otokenFactory;
    }
}
