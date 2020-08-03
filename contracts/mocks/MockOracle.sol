pragma solidity =0.6.10;

/**
 * SPDX-License-Identifier: UNLICENSED
 * @dev The MockOracle contract let us easily manipulate the oracle state in testings.
 */
contract MockOracle {
    address public addressBook;
    uint256 public mockedPrice;
    bool public mockedFinalized;

    constructor(address _addressBook) public {
        addressBook = _addressBook;
    }

    function getBatchPrice(bytes32 _batch, uint256 _timestamp) external view returns (uint256, bool) {
        require(_batch != 0x00);
        require(_timestamp > 0);
        return (mockedPrice, mockedFinalized);
    }

    function setMockedStatus(uint256 _pirce, bool _finalized) external {
        mockedPrice = _pirce;
        mockedFinalized = _finalized;
    }
}
