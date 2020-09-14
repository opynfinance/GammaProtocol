/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import {OwnableUpgradeSafe} from "./packages/oz/upgradeability/OwnableUpgradeSafe.sol";
import {ReentrancyGuardUpgradeSafe} from "./packages/oz/upgradeability/ReentrancyGuardUpgradeSafe.sol";
import {Initializable} from "./packages/oz/upgradeability/Initializable.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";
import {MarginAccount} from "./libs/MarginAccount.sol";
import {Actions} from "./libs/Actions.sol";
import {AddressBookInterface} from "./interfaces/AddressBookInterface.sol";
import {OtokenInterface} from "./interfaces/OtokenInterface.sol";
import {MarginCalculatorInterface} from "./interfaces/MarginCalculatorInterface.sol";
import {OracleInterface} from "./interfaces/OracleInterface.sol";
import {WhitelistInterface} from "./interfaces/WhitelistInterface.sol";
import {MarginPoolInterface} from "./interfaces/MarginPoolInterface.sol";
import {CalleeInterface} from "./interfaces/CalleeInterface.sol";

/**
 * @author Opyn Team
 * @title Controller
 * @notice contract that controls the gamma protocol and interaction with all sub contracts
 */
contract Controller is Initializable, OwnableUpgradeSafe, ReentrancyGuardUpgradeSafe {
    using MarginAccount for MarginAccount.Vault;
    using SafeMath for uint256;

    AddressBookInterface public addressbook;
    WhitelistInterface public whitelist;
    OracleInterface public oracle;
    MarginCalculatorInterface public calculator;
    MarginPoolInterface public pool;

    /// @notice address that has permission to pause the system
    address public pauser;

    /// @notice address that has permission to execute an emergency shutdown
    address public terminator;

    /// @notice if true, all system functionality is paused other than exercise and settle vault
    bool public systemPaused;

    /// @notice if true, all system functionality is paused
    bool public systemShutdown;

    /// @notice if true, a call action can only be executed to a whitelisted callee
    bool public callRestricted;

    /// @dev mapping between an owner address and the number of owner address vaults
    mapping(address => uint256) internal accountVaultCounter;
    /// @dev mapping between an owner address and a specific vault using a vault id
    mapping(address => mapping(uint256 => MarginAccount.Vault)) internal vaults;
    /// @dev mapping between an account owner and their approved or unapproved account operators
    mapping(address => mapping(address => bool)) internal operators;

    /// @notice emits an event when an account operator is updated for a specific account owner
    event AccountOperatorUpdated(address indexed accountOwner, address indexed operator, bool isSet);
    /// @notice emits an event when a new vault is opened
    event VaultOpened(address indexed accountOwner, uint256 vaultId);
    /// @notice emits an event when a long oToken is deposited into a vault
    event LongOtokenDeposited(
        address indexed otoken,
        address indexed accountOwner,
        address indexed from,
        uint256 vaultId,
        uint256 amount
    );
    /// @notice emits an event when a long oToken is withdrawn from a vault
    event LongOtokenWithdrawed(
        address indexed otoken,
        address indexed AccountOwner,
        address indexed to,
        uint256 vaultId,
        uint256 amount
    );
    /// @notice emits an event when a collateral asset is deposited into a vault
    event CollateralAssetDeposited(
        address indexed asset,
        address indexed accountOwner,
        address indexed from,
        uint256 vaultId,
        uint256 amount
    );
    /// @notice emits an event when a collateral asset is withdrawn from a vault
    event CollateralAssetWithdrawed(
        address indexed asset,
        address indexed AccountOwner,
        address indexed to,
        uint256 vaultId,
        uint256 amount
    );
    /// @notice emits an event when a short oToken is minted from a vault
    event ShortOtokenMinted(
        address indexed otoken,
        address indexed AccountOwner,
        address indexed to,
        uint256 vaultId,
        uint256 amount
    );
    /// @notice emits an event when a short oToken is burned
    event ShortOtokenBurned(
        address indexed otoken,
        address indexed AccountOwner,
        address indexed from,
        uint256 vaultId,
        uint256 amount
    );
    /// @notice emits an event when an oToken is exercised
    event Exercise(
        address indexed otoken,
        address indexed exerciser,
        address indexed receiver,
        address collateralAsset,
        uint256 otokenBurned,
        uint256 payout
    );
    /// @notice emits an event when a vault is settled
    event VaultSettled(
        address indexed otoken,
        address indexed AccountOwner,
        address indexed to,
        uint256 vaultId,
        uint256 payout
    );
    /// @notice emits an event when a call action is executed
    event CallExecuted(
        address indexed from,
        address indexed to,
        address indexed vaultOwner,
        uint256 vaultId,
        bytes data
    );
    /// @notice emits an event when the terminator address changes
    event TerminatorUpdated(address indexed oldTerminator, address indexed newTerminator);
    /// @notice emits an event when the pauser address changes
    event PauserUpdated(address indexed oldPauser, address indexed newPauser);
    /// @notice emits an event when the system paused status changes
    event SystemPaused(bool isActive);
    /// @notice emits an event when the system emergency shutdown status changes
    event EmergencyShutdown(bool isActive);
    /// @notice emits an event when the call action restriction changes
    event CallRestricted(bool isRestricted);

    /**
     * @notice modifier to check if the system is not paused
     */
    modifier notPaused {
        _isNotPaused();

        _;
    }

    /**
     * @notice modifier to check if the system is not in an emergency shutdown state
     */
    modifier notShutdown {
        _isNotShutdown();

        _;
    }

    /**
     * @notice modifier to check if sender is the terminator address
     */
    modifier onlyTerminator {
        require(msg.sender == terminator, "Controller: sender is not terminator");

        _;
    }

    /**
     * @notice modifier to check if the sender is the pauser address
     */
    modifier onlyPauser {
        require(msg.sender == pauser, "Controller: sender is not pauser");

        _;
    }

    /**
     * @notice modifier to check if the sender is an account owner or an approved account operator
     * @param _sender sender address
     * @param _accountOwner account owner address
     */
    modifier onlyAuthorized(address _sender, address _accountOwner) {
        _isAuthorized(_sender, _accountOwner);

        _;
    }

    /**
     * @notice modifier to check if the called address is a whitelisted callee address
     * @param _callee called address
     */
    modifier onlyWhitelistedCallee(address _callee) {
        if (callRestricted) {
            require(_isCalleeWhitelisted(_callee), "Controller: callee is not a whitelisted address");
        }

        _;
    }

    /**
     * @dev check if the system is not paused
     */
    function _isNotPaused() internal view {
        require(!systemPaused, "Controller: system is paused");
    }

    /**
     * @dev check if the system is not in an emergency shutdown state
     */
    function _isNotShutdown() internal view {
        require(!systemShutdown, "Controller: system is in emergency shutdown state");
    }

    /**
     * @dev check if the sender is an authorized operator
     * @param _sender msg.sender
     * @param _accountOwner owner of a vault
     */
    function _isAuthorized(address _sender, address _accountOwner) internal view {
        require(
            (_sender == _accountOwner) || (operators[_accountOwner][_sender]),
            "Controller: msg.sender is not authorized to run action"
        );
    }

    /**
     * @notice initalize the deployed contract
     * @param _addressBook addressbook module
     * @param _owner account owner address
     */
    function initialize(address _addressBook, address _owner) external initializer {
        require(_addressBook != address(0), "Controller: invalid addressbook address");

        __Context_init_unchained();
        __Ownable_init_unchained(_owner);
        __ReentrancyGuard_init_unchained();

        addressbook = AddressBookInterface(_addressBook);
        _refreshConfigInternal();
    }

    /**
     * @notice allows the pauser to toggle the pause variable and pause or unpause the system
     * @dev can only be called by the pauser
     * @param _paused new boolean value to set systemPaused to
     */
    function setSystemPaused(bool _paused) external onlyPauser {
        require(systemPaused != _paused, "Controller: cannot change pause status");

        systemPaused = _paused;

        emit SystemPaused(systemPaused);
    }

    /**
     * @notice allows the terminator to toggle the emergency shutdown variable and put the system in an emergency shutdown state or return to a non-emergency shutdown state
     * @dev can only be called by the terminator
     * @param _shutdown new boolean value to set systemShutdown to
     */
    function setEmergencyShutdown(bool _shutdown) external onlyTerminator {
        require(systemShutdown != _shutdown, "Controller: cannot change shutdown status");

        systemShutdown = _shutdown;

        emit EmergencyShutdown(systemShutdown);
    }

    /**
     * @notice allows the owner to set the terminator address
     * @dev can only be called by the owner
     * @param _terminator new terminator address
     */
    function setTerminator(address _terminator) external onlyOwner {
        require(_terminator != address(0), "Controller: terminator cannot be set to address zero");

        emit TerminatorUpdated(terminator, _terminator);

        terminator = _terminator;
    }

    /**
     * @notice allows the owner to set the pauser address
     * @dev can only be called by the owner
     * @param _pauser new pauser address
     */
    function setPauser(address _pauser) external onlyOwner {
        require(_pauser != address(0), "Controller: pauser cannot be set to address zero");

        emit PauserUpdated(pauser, _pauser);

        pauser = _pauser;
    }

    /**
     * @notice allows the owner to toggle the restriction on whitelisted call actions and only allow whitelisted call addresses or allow any arbitrary call addresses
     * @dev can only be called by the owner
     * @param _isRestricted new call restriction
     */
    function setCallRestriction(bool _isRestricted) external onlyOwner {
        callRestricted = _isRestricted;

        emit CallRestricted(callRestricted);
    }

    /**
     * @notice allows a user to give or revoke privileges to an operator which can act on their behalf on their vaults
     * @dev can only be updated by the vault owner
     * @param _operator operator that the sender wants to give privileges to or revoke them from
     * @param _isOperator new boolean value that expresses if the sender is giving or revoking privileges for _operator
     */
    function setOperator(address _operator, bool _isOperator) external {
        operators[msg.sender][_operator] = _isOperator;

        emit AccountOperatorUpdated(msg.sender, _operator, _isOperator);
    }

    /**
     * @dev updates the configuration of the controller. can only be called by the owner
     */
    function refreshConfiguration() external onlyOwner {
        _refreshConfigInternal();
    }

    /**
     * @notice execute a number of actions on specific vaults
     * @dev can only be called when the system is not shutdown
     * @param _actions array of actions arguments
     */
    function operate(Actions.ActionArgs[] memory _actions) external payable nonReentrant notShutdown {
        (bool vaultUpdated, address vaultOwner, uint256 vaultId) = _runActions(_actions);
        if (vaultUpdated) _verifyFinalState(vaultOwner, vaultId);
    }

    /**
     * @notice check if a specific address is an operator for an owner account
     * @param _owner account owner address
     * @param _operator account operator address
     * @return true if the _operator is an approved operator for the _owner account
     */
    function isOperator(address _owner, address _operator) external view returns (bool) {
        return operators[_owner][_operator];
    }

    /**
     * @notice returns the current controller configuration
     * @return whitelist, the address of the whitelist module
     * @return oracle, the address of the oracle module
     * @return calculator, the address of the calculator module
     * @return pool, the address of the pool module
     */
    function getConfiguration()
        external
        view
        returns (
            address,
            address,
            address,
            address
        )
    {
        return (address(whitelist), address(oracle), address(calculator), address(pool));
    }

    /**
     * @notice before expiry or if there is no short oToken in a vault, return a the vault, if the short oToken has expired, adjust the vault collateral balances by the net option proceeds
     * @dev if vault has no short oToken or the issued oToken is not expired yet, return the vault, else call getExcessCollateral and return it as collateral amount inside Vault struct.
     * @param _owner account owner of the vault
     * @param _vaultId vaultId to return balances for
     * @return Vault struct with balances
     */
    function getVaultBalances(address _owner, uint256 _vaultId) external view returns (MarginAccount.Vault memory) {
        MarginAccount.Vault memory vault = getVault(_owner, _vaultId);

        // if there is no minted short oToken or the short oToken has not expired yet
        if ((vault.shortOtokens.length == 0) || (!isExpired(vault.shortOtokens[0]))) return vault;

        (uint256 netValue, ) = calculator.getExcessCollateral(vault);
        vault.collateralAmounts[0] = netValue;
        return vault;
    }

    /**
     * @dev return if an expired oToken contract’s settlement price has been finalized
     * @param _otoken address of the oToken
     * @return true if the oToken has expired AND the oraclePrice at the expiry timestamp has been finalized, otherwise it returns false
     */
    function isPriceFinalized(address _otoken) public view returns (bool) {
        OtokenInterface otoken = OtokenInterface(_otoken);

        address underlying = otoken.underlyingAsset();
        uint256 expiry = otoken.expiryTimestamp();

        bool isFinalized = oracle.isDisputePeriodOver(underlying, expiry);
        return isFinalized;
    }

    /**
     * @notice get the number of current vaults for a specified account owner
     * @param _accountOwner account owner address
     * @return number of vaults
     */
    function getAccountVaultCounter(address _accountOwner) external view returns (uint256) {
        return accountVaultCounter[_accountOwner];
    }

    /**
     * @notice check if an oToken has expired
     * @param _otoken oToken address
     * @return true if the otoken has expired, otherwise it returns false
     */
    function isExpired(address _otoken) public view returns (bool) {
        uint256 otokenExpiryTimestamp = OtokenInterface(_otoken).expiryTimestamp();

        return now > otokenExpiryTimestamp;
    }

    /**
     * @notice return a specific vault
     * @param _owner account owner
     * @param _vaultId vault id of vault to return
     * @return Vault struct that corresponds to the _vaultId of _owner
     */
    function getVault(address _owner, uint256 _vaultId) public view returns (MarginAccount.Vault memory) {
        return vaults[_owner][_vaultId];
    }

    /**
     * @notice execute a variety of actions
     * @dev for each action in the action array, execute the corresponding action, only one vault can be modified for all actions except SettleVault, Exercise, and Call
     * @param _actions array of type Actions.ActionArgs[], which expresses which actions the user wants to execute
     * @return vaultUpdated, indicates if a vault has changed
     * @return owner, the vault owner if a vault has changed
     * @return vaultId, the vault Id if a vault has changed
     */
    function _runActions(Actions.ActionArgs[] memory _actions)
        internal
        returns (
            bool,
            address,
            uint256
        )
    {
        address vaultOwner;
        uint256 vaultId;
        bool vaultUpdated;

        for (uint256 i = 0; i < _actions.length; i++) {
            Actions.ActionArgs memory action = _actions[i];
            Actions.ActionType actionType = action.actionType;

            if (
                (actionType != Actions.ActionType.SettleVault) &&
                (actionType != Actions.ActionType.Exercise) &&
                (actionType != Actions.ActionType.Call)
            ) {
                // check if this action is manipulating the same vault as all other actions, other than SettleVault
                if (vaultUpdated) {
                    require(vaultOwner == action.owner, "Controller: can not run actions for different owners");
                    require(vaultId == action.vaultId, "Controller: can not run actions on different vaults");
                }
                vaultUpdated = true;
                vaultId = action.vaultId;
                vaultOwner = action.owner;
            }

            if (actionType == Actions.ActionType.OpenVault) {
                _openVault(Actions._parseOpenVaultArgs(action));
            } else if (actionType == Actions.ActionType.DepositLongOption) {
                _depositLong(Actions._parseDepositArgs(action));
            } else if (actionType == Actions.ActionType.WithdrawLongOption) {
                _withdrawLong(Actions._parseWithdrawArgs(action));
            } else if (actionType == Actions.ActionType.DepositCollateral) {
                _depositCollateral(Actions._parseDepositArgs(action));
            } else if (actionType == Actions.ActionType.WithdrawCollateral) {
                _withdrawCollateral(Actions._parseWithdrawArgs(action));
            } else if (actionType == Actions.ActionType.MintShortOption) {
                _mintOtoken(Actions._parseMintArgs(action));
            } else if (actionType == Actions.ActionType.BurnShortOption) {
                _burnOtoken(Actions._parseBurnArgs(action));
            } else if (actionType == Actions.ActionType.Exercise) {
                _exercise(Actions._parseExerciseArgs(action));
            } else if (actionType == Actions.ActionType.SettleVault) {
                _settleVault(Actions._parseSettleVaultArgs(action));
            } else if (actionType == Actions.ActionType.Call) {
                _call(Actions._parseCallArgs(action));
            }
        }

        return (vaultUpdated, vaultOwner, vaultId);
    }

    /**
     * @notice verify the vault final state after executing all actions
     * @param _owner account owner address
     * @param _vaultId vault id of the final vault
     */
    function _verifyFinalState(address _owner, uint256 _vaultId) internal view {
        MarginAccount.Vault memory _vault = getVault(_owner, _vaultId);
        (, bool isValidVault) = calculator.getExcessCollateral(_vault);

        require(isValidVault, "Controller: invalid final vault state");
    }

    /**
     * @notice open a new vault inside an account
     * @dev only the account owner or operator can open a vault, cannot be called when system is paused or shutdown
     * @param _args OpenVaultArgs structure
     */
    function _openVault(Actions.OpenVaultArgs memory _args) internal notPaused onlyAuthorized(msg.sender, _args.owner) {
        accountVaultCounter[_args.owner] = accountVaultCounter[_args.owner].add(1);

        require(
            _args.vaultId == accountVaultCounter[_args.owner],
            "Controller: can not run actions on inexistent vault"
        );

        emit VaultOpened(_args.owner, accountVaultCounter[_args.owner]);
    }

    /**
     * @notice deposit a long oToken into a vault
     * @dev cannot be called when system is paused or shutdown
     * @param _args DepositArgs structure
     */
    function _depositLong(Actions.DepositArgs memory _args) internal notPaused {
        require(_checkVaultId(_args.owner, _args.vaultId), "Controller: invalid vault id");
        require(
            (_args.from == msg.sender) || (_args.from == _args.owner),
            "Controller: cannot deposit long otoken from this address"
        );

        require(
            whitelist.isWhitelistedOtoken(_args.asset),
            "Controller: otoken is not whitelisted to be used as collateral"
        );

        OtokenInterface otoken = OtokenInterface(_args.asset);

        require(now <= otoken.expiryTimestamp(), "Controller: otoken used as collateral is already expired");

        vaults[_args.owner][_args.vaultId].addLong(address(otoken), _args.amount, _args.index);

        pool.transferToPool(address(otoken), _args.from, _args.amount);

        emit LongOtokenDeposited(address(otoken), _args.owner, _args.from, _args.vaultId, _args.amount);
    }

    /**
     * @notice withdraw a long oToken from a vault
     * @dev only the account owner or operator can withdraw a long oToken from a vault, cannot be called when system is paused or shutdown
     * @param _args WithdrawArgs structure
     */
    function _withdrawLong(Actions.WithdrawArgs memory _args)
        internal
        notPaused
        onlyAuthorized(msg.sender, _args.owner)
    {
        require(_checkVaultId(_args.owner, _args.vaultId), "Controller: invalid vault id");

        OtokenInterface otoken = OtokenInterface(_args.asset);

        require(now <= otoken.expiryTimestamp(), "Controller: can not withdraw an expired otoken");

        vaults[_args.owner][_args.vaultId].removeLong(address(otoken), _args.amount, _args.index);

        pool.transferToUser(address(otoken), _args.to, _args.amount);

        emit LongOtokenWithdrawed(address(otoken), _args.owner, _args.to, _args.vaultId, _args.amount);
    }

    /**
     * @notice deposit a collateral asset into a vault
     * @dev cannot be called when the system is paused or shutdown
     * @param _args DepositArgs structure
     */
    function _depositCollateral(Actions.DepositArgs memory _args) internal notPaused {
        require(_checkVaultId(_args.owner, _args.vaultId), "Controller: invalid vault id");
        require(
            (_args.from == msg.sender) || (_args.from == _args.owner),
            "Controller: cannot deposit collateral from this address"
        );

        require(
            whitelist.isWhitelistedCollateral(_args.asset),
            "Controller: asset is not whitelisted to be used as collateral"
        );

        vaults[_args.owner][_args.vaultId].addCollateral(_args.asset, _args.amount, _args.index);

        pool.transferToPool(_args.asset, _args.from, _args.amount);

        emit CollateralAssetDeposited(_args.asset, _args.owner, _args.from, _args.vaultId, _args.amount);
    }

    /**
     * @notice withdraw a collateral asset from a vault
     * @dev only the account owner or operator can withdraw a collateral from a vault, cannot be called when system is paused or shutdown
     * @param _args WithdrawArgs structure
     */
    function _withdrawCollateral(Actions.WithdrawArgs memory _args)
        internal
        notPaused
        onlyAuthorized(msg.sender, _args.owner)
    {
        require(_checkVaultId(_args.owner, _args.vaultId), "Controller: invalid vault id");

        MarginAccount.Vault memory vault = getVault(_args.owner, _args.vaultId);
        if (_isNotEmpty(vault.shortOtokens)) {
            OtokenInterface otoken = OtokenInterface(vault.shortOtokens[0]);

            require(
                now <= otoken.expiryTimestamp(),
                "Controller: can not withdraw collateral from a vault with an expired short otoken"
            );
        }

        vaults[_args.owner][_args.vaultId].removeCollateral(_args.asset, _args.amount, _args.index);

        pool.transferToUser(_args.asset, _args.to, _args.amount);

        emit CollateralAssetWithdrawed(_args.asset, _args.owner, _args.to, _args.vaultId, _args.amount);
    }

    /**
     * @notice mint short oTokens from a vault which creates an obligation recorded in a vault
     * @dev only the account owner or operator can mint short oTokens from a vault, cannot be called when system is paused or shutdown
     * @param _args MintArgs structure
     */
    function _mintOtoken(Actions.MintArgs memory _args) internal notPaused onlyAuthorized(msg.sender, _args.owner) {
        require(_checkVaultId(_args.owner, _args.vaultId), "Controller: invalid vault id");

        require(whitelist.isWhitelistedOtoken(_args.otoken), "Controller: otoken is not whitelisted to be minted");

        OtokenInterface otoken = OtokenInterface(_args.otoken);

        require(now <= otoken.expiryTimestamp(), "Controller: can not mint expired otoken");

        vaults[_args.owner][_args.vaultId].addShort(_args.otoken, _args.amount, _args.index);

        otoken.mintOtoken(_args.to, _args.amount);

        emit ShortOtokenMinted(_args.otoken, _args.owner, _args.to, _args.vaultId, _args.amount);
    }

    /**
     * @notice burn oTokens to reduce or remove minted oToken obligation recorded in a vault
     * @dev only the account owner or operator can burn oTokens for a vault, cannot be called when system is paused or shutdown
     * @param _args MintArgs structure
     */
    function _burnOtoken(Actions.BurnArgs memory _args) internal notPaused onlyAuthorized(msg.sender, _args.owner) {
        require(_checkVaultId(_args.owner, _args.vaultId), "Controller: invalid vault id");
        require((_args.from == msg.sender) || (_args.from == _args.owner), "Controller: cannot burn from this address");

        OtokenInterface otoken = OtokenInterface(_args.otoken);

        require(now <= otoken.expiryTimestamp(), "Controller: can not burn expired otoken");

        vaults[_args.owner][_args.vaultId].removeShort(_args.otoken, _args.amount, _args.index);

        otoken.burnOtoken(_args.from, _args.amount);

        emit ShortOtokenBurned(_args.otoken, _args.owner, _args.from, _args.vaultId, _args.amount);
    }

    /**
     * @notice exercise an oToken after expiry, receiving the payout of the oToken in the collateral asset
     * @dev cannot be called when system is paused
     * @param _args ExerciseArgs structure
     */
    function _exercise(Actions.ExerciseArgs memory _args) internal {
        OtokenInterface otoken = OtokenInterface(_args.otoken);

        require(now > otoken.expiryTimestamp(), "Controller: can not exercise un-expired otoken");

        require(isPriceFinalized(_args.otoken), "Controller: otoken underlying asset price is not finalized yet");

        uint256 payout = _getPayout(_args.otoken, _args.amount);

        otoken.burnOtoken(msg.sender, _args.amount);

        pool.transferToUser(otoken.collateralAsset(), _args.receiver, payout);

        emit Exercise(_args.otoken, msg.sender, _args.receiver, otoken.collateralAsset(), _args.amount, payout);
    }

    /**
     * @notice settle a vault after expiry, removing the remaining collateral in a vault after both long and short oToken payouts have been removed
     * @dev deletes a vault of vaultId after remaining collateral is removed, cannot be called when system is paused
     * @param _args SettleVaultArgs structure
     */
    function _settleVault(Actions.SettleVaultArgs memory _args) internal onlyAuthorized(msg.sender, _args.owner) {
        require(_checkVaultId(_args.owner, _args.vaultId), "Controller: invalid vault id");

        MarginAccount.Vault memory vault = getVault(_args.owner, _args.vaultId);

        require(_isNotEmpty(vault.shortOtokens), "Controller: can not settle a vault with no otoken minted");

        OtokenInterface shortOtoken = OtokenInterface(vault.shortOtokens[0]);

        require(now > shortOtoken.expiryTimestamp(), "Controller: can not settle vault with un-expired otoken");
        require(
            isPriceFinalized(address(shortOtoken)),
            "Controller: otoken underlying asset price is not finalized yet"
        );

        (uint256 payout, ) = calculator.getExcessCollateral(vault);

        if (_isNotEmpty(vault.longOtokens)) {
            OtokenInterface longOtoken = OtokenInterface(vault.longOtokens[0]);

            longOtoken.burnOtoken(address(pool), vault.longAmounts[0]);
        }

        delete vaults[_args.owner][_args.vaultId];

        pool.transferToUser(shortOtoken.collateralAsset(), _args.to, payout);

        emit VaultSettled(address(shortOtoken), _args.owner, _args.to, _args.vaultId, payout);
    }

    /**
     * @notice execute arbitrary calls
     * @dev cannot be called when system is paused or shutdown
     * @param _args Call action
     */
    function _call(Actions.CallArgs memory _args) internal notPaused onlyWhitelistedCallee(_args.callee) {
        CalleeInterface(_args.callee).callFunction{value: _args.msgValue}(
            msg.sender,
            _args.owner,
            _args.vaultId,
            _args.data
        );

        emit CallExecuted(msg.sender, _args.callee, _args.owner, _args.vaultId, _args.data);
    }

    /**
     * @notice check if a vault id is valid
     * @param _accountOwner account owner address
     * @param _vaultId vault id to check
     * @return true if the _vaultId is valid, otherwise it returns falue
     */
    function _checkVaultId(address _accountOwner, uint256 _vaultId) internal view returns (bool) {
        return ((_vaultId > 0) && (_vaultId <= accountVaultCounter[_accountOwner]));
    }

    function _isNotEmpty(address[] memory _array) internal pure returns (bool) {
        return (_array.length > 0) && (_array[0] != address(0));
    }

    /**
     * @notice get the oToken's payout after expiry, in the collateral asset
     * @param _otoken oToken address
     * @param _amount amount of the oToken to calculate the payout for, always represented in 1e18
     * @return amount of collateral to pay out
     */
    function _getPayout(address _otoken, uint256 _amount) internal view returns (uint256) {
        uint256 rate = calculator.getExpiredPayoutRate(_otoken);
        return rate.mul(_amount).div(1e18);
    }

    /**
     * @notice return if a callee address is whitelisted or not
     * @param _callee callee address
     * @return true if callee address is whitelisted, otherwise false
     */
    function _isCalleeWhitelisted(address _callee) internal view returns (bool) {
        return whitelist.isWhitelistedCallee(_callee);
    }

    /**
     * @dev updates the internal configuration of the controller
     */
    function _refreshConfigInternal() internal {
        whitelist = WhitelistInterface(addressbook.getWhitelist());
        oracle = OracleInterface(addressbook.getOracle());
        calculator = MarginCalculatorInterface(addressbook.getMarginCalculator());
        pool = MarginPoolInterface(addressbook.getMarginPool());
    }
}
