/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 * @notice Chainlink oracle mock
 */
contract MockChainlinkAggregator {
    uint256 public decimals = 8;

    /// @dev mock for round timestmap
    mapping(uint256 => uint256) internal roundTimestamp;
    /// @dev mock for round price
    mapping(uint256 => int256) internal roundAnswer;

    int256 internal lastAnswer;

    function getRoundData(uint80 _roundId)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        require(roundTimestamp[_roundId] != 0, "No data present");

        return (_roundId, roundAnswer[_roundId], roundTimestamp[_roundId], roundTimestamp[_roundId], _roundId);
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (1, lastAnswer, now, now, 1);
    }

    /// @dev function to mock setting round timestamp
    function setRoundTimestamp(uint256 _roundId, uint256 _timestamp) external {
        roundTimestamp[_roundId] = _timestamp;
    }

    /// @dev function to mock setting round timestamp
    function setRoundAnswer(uint256 _roundId, int256 _answer) external {
        roundAnswer[_roundId] = _answer;
    }

    function setLatestAnswer(int256 _answer) external {
        lastAnswer = _answer;
    }
}
