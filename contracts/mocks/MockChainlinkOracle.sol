/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 * @notice Chainlink oracle mock
 */
contract MockChainlinkOracle {
    /// @dev mock for round timestmap
    mapping(uint256 => uint256) internal roundTimestamp;
    /// @dev mock for round price
    mapping(uint256 => int256) internal roundAnswer;

    function getAnswer(uint256 _roundId) external view returns (int256) {
        return roundAnswer[_roundId];
    }

    function getTimestamp(uint256 _roundId) external view returns (uint256) {
        return roundTimestamp[_roundId];
    }

    /// @dev function to mock setting round timestamp
    function setRoundTimestamp(uint256 _roundId, uint256 _timestamp) external {
        roundTimestamp[_roundId] = _timestamp;
    }

    /// @dev function to mock setting round timestamp
    function setRoundAnswer(uint256 _roundId, int256 _answer) external {
        roundAnswer[_roundId] = _answer;
    }
}
