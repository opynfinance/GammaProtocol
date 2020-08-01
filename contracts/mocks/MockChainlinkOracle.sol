/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import "../interfaces/AggregatorInterface.sol";

/**
 * @notice Chainlink oracle mock
 */
contract MockChainlinkOracle is AggregatorInterface {
    /// @dev mock for rounds timestmap
    mapping(uint256 => uint256) internal roundTimestamp;

    function latestAnswer() external view returns (int256);

    function latestTimestamp() external view returns (uint256);

    function latestRound() external view returns (uint256);

    function getAnswer(uint256 roundId) external view returns (int256);

    function getTimestamp(uint256 roundId) external view returns (uint256);

    // function to mock round timestamp
    function setRoundTimestamp(uint256 _roundId, uint256 _timestamp) external {
        roundTimestamp[_roundId] = _timestamp;
    }

    //event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 timestamp);
    //event NewRound(uint256 indexed roundId, address indexed startedBy, uint256 startedAt);
}
