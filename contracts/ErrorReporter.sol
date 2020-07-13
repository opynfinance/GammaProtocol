pragma solidity =0.6.10;

/**
 * SPDX-License-Identifier: UNLICENSED
 * @title FactoryErrorReporter
 * @author Opyn
 * @notice Report a specific error
 */
contract FactoryErrorReporter {
    enum Error {NO_ERROR, OPTION_EXISTS, UNWHITELISTED_PRODUCT}

    event Failure(uint256 error);

    /**
     * @dev report an error
     */
    function fail(Error err) internal returns (uint256) {
        emit Failure(uint256(err));
        return uint256(err);
    }
}
