/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import "./packages/oz/SafeMath.sol";

contract Timelock {
    using SafeMath for uint256;

    /// @notice event emitted when new admin get assigned
    event NewAdmin(address indexed newAdmin);
    /// @notice event emitted when new pending admin get assigned
    event NewPendingAdmin(address indexed newPendingAdmin);
    /// @notice event emitted when a new delay is set
    event NewDelay(uint256 indexed newDelay);
    /// @notice event emitted when a transaction get cancelled
    event CancelTransaction(
        bytes32 indexed txHash,
        address indexed _target,
        uint256 _value,
        string _signature,
        bytes _data,
        uint256 _eta
    );
    /// @notice event emitted when a transaction get executed
    event ExecuteTransaction(
        bytes32 indexed txHash,
        address indexed _target,
        uint256 _value,
        string _signature,
        bytes _data,
        uint256 _eta
    );
    /// @notice event emitted when a transaction get queued
    event QueueTransaction(
        bytes32 indexed txHash,
        address indexed _target,
        uint256 _value,
        string _signature,
        bytes _data,
        uint256 _eta
    );

    /// @notice grace period
    uint256 public constant GRACE_PERIOD = 14 days;
    /// @notice minimum days of delay
    uint256 public constant MINIMUM_DELAY = 2 days;
    /// @notice maximum days of delay
    uint256 public constant MAXIMUM_DELAY = 30 days;

    /// @notice admin address
    address public admin;
    /// @notice pending admin address
    address public pendingAdmin;
    /// @notice delay period
    uint256 public delay;

    /// @notice mapping of queued transactions
    mapping(bytes32 => bool) public queuedTransactions;

    /**
     * @notice contructor
     * @param _admin admin address
     * @param _delay delay period
     */
    constructor(address _admin, uint256 _delay) public {
        require(_delay >= MINIMUM_DELAY, "Timelock::constructor: Delay must exceed minimum delay.");
        require(_delay <= MAXIMUM_DELAY, "Timelock::setDelay: Delay must not exceed maximum delay.");

        admin = _admin;
        delay = _delay;
    }

    /**
     * @notice fallback function to reveive ETH
     */
    receive() external payable {}

    /**
     * @notice set delay period
     * @param _delay delay period
     */
    function setDelay(uint256 _delay) public {
        require(msg.sender == address(this), "Timelock::setDelay: Call must come from Timelock.");
        require(_delay >= MINIMUM_DELAY, "Timelock::setDelay: Delay must exceed minimum delay.");
        require(_delay <= MAXIMUM_DELAY, "Timelock::setDelay: Delay must not exceed maximum delay.");
        delay = _delay;

        emit NewDelay(delay);
    }

    /**
     * @notice accept timelock admin
     */
    function acceptAdmin() public {
        require(msg.sender == pendingAdmin, "Timelock::acceptAdmin: Call must come from pendingAdmin.");
        admin = msg.sender;
        pendingAdmin = address(0);

        emit NewAdmin(admin);
    }

    /**
     * @notice set pending admin
     * @param _pendingAdmin pending admin address
     */
    function setPendingAdmin(address _pendingAdmin) public {
        require(msg.sender == address(this), "Timelock::setPendingAdmin: Call must come from Timelock.");
        pendingAdmin = _pendingAdmin;

        emit NewPendingAdmin(pendingAdmin);
    }

    /**
     * @notice queue transaction
     * @param _target contract address to call
     * @param _value value
     * @param _signature tx signature
     * @param _data tx data
     * @param _eta estimated block execution
     * @return transaction hash
     */
    function queueTransaction(
        address _target,
        uint256 _value,
        string memory _signature,
        bytes memory _data,
        uint256 _eta
    ) public returns (bytes32) {
        require(msg.sender == admin, "Timelock::queueTransaction: Call must come from admin.");
        require(
            _eta >= getBlockTimestamp().add(delay),
            "Timelock::queueTransaction: Estimated execution block must satisfy delay."
        );

        bytes32 txHash = keccak256(abi.encode(_target, _value, _signature, _data, _eta));
        queuedTransactions[txHash] = true;

        emit QueueTransaction(txHash, _target, _value, _signature, _data, _eta);
        return txHash;
    }

    /**
     * @notice cancel a queued transaction
     * @param _target contract address to call
     * @param _value value
     * @param _signature tx signature
     * @param _data tx data
     * @param _eta estimated block execution
     */
    function cancelTransaction(
        address _target,
        uint256 _value,
        string memory _signature,
        bytes memory _data,
        uint256 _eta
    ) public {
        require(msg.sender == admin, "Timelock::cancelTransaction: Call must come from admin.");

        bytes32 txHash = keccak256(abi.encode(_target, _value, _signature, _data, _eta));
        queuedTransactions[txHash] = false;

        emit CancelTransaction(txHash, _target, _value, _signature, _data, _eta);
    }

    /**
     * @notice execute a queued transaction
     * @param _target contract address to call
     * @param _value value
     * @param _signature tx signature
     * @param _data tx data
     * @param _eta estimated block execution
     * @return transaction hash
     */
    function executeTransaction(
        address _target,
        uint256 _value,
        string memory _signature,
        bytes memory _data,
        uint256 _eta
    ) public payable returns (bytes memory) {
        require(msg.sender == admin, "Timelock::executeTransaction: Call must come from admin.");

        bytes32 txHash = keccak256(abi.encode(_target, _value, _signature, _data, _eta));
        require(queuedTransactions[txHash], "Timelock::executeTransaction: Transaction hasn't been queued.");
        require(getBlockTimestamp() >= _eta, "Timelock::executeTransaction: Transaction hasn't surpassed time lock.");
        require(getBlockTimestamp() <= _eta.add(GRACE_PERIOD), "Timelock::executeTransaction: Transaction is stale.");

        queuedTransactions[txHash] = false;

        bytes memory callData;

        if (bytes(_signature).length == 0) {
            callData = _data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(_signature))), _data);
        }

        // solium-disable-next-line security/no-call-_value
        (bool success, bytes memory returndata) = _target.call.value(_value)(callData);
        require(success, "Timelock::executeTransaction: Transaction execution reverted.");

        emit ExecuteTransaction(txHash, _target, _value, _signature, _data, _eta);

        return returndata;
    }

    /**
     * @notice get block timestamp
     */
    function getBlockTimestamp() internal view returns (uint256) {
        // solium-disable-next-line security/no-block-members
        return block.timestamp;
    }
}
