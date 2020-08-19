pragma solidity =0.6.10;

import {Ownable} from "./packages/oz/Ownable.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";

/**
 * SPDX-License-Identifier: UNLICENSED
 * @dev The Controller is...
 */
// solhint-disable-next-line no-empty-blocks
contract Controller is Ownable {
    //WHAT DOES OWNABLE DO?
    using SafeMath for uint256;

    address internal addressBook;

    bool internal systemPaused;
    //TODO: should this be internal? also do we need setters and getters for the two above?

    mapping (address  => MarginAccount.Account) internal accounts;
    mapping (address  => mapping (uint256  => MarginAccount.Vault)) internal vaults;
    mapping (address => mapping(address => bool)) internal operators;

    event NewOperatorSet(address newOperator);

    modifier isPaused {
        require(
            throw
            //TODO: write this logic
        );
        _;
    }

    //TODO: is the following even neeeded if the above exists?
    modifier isNotPaused {
        require(
        throw
        //TODO: write this logic
        );
        _;
    }

    modifier isExpired(asset) {
        require(
        throw
        //TODO: write this logic
        );
        _;
    }


    //High level: Check if the msg sender is the vault owner or is the operator of the owner.
    modifier isAuthorized(owner) {
        require(
        throw
        //TODO: write this logic
        );
        _;
    }

    constructor (address _addressBook) external {
        addressBook = _addressBook;
    }

    /**
     * @dev allows admin to toggle pause / emergency shutdown
     * @param _paused The new boolean value to set systemPaused to.
     */
    function setSystemPaused(bool _paused) external onlyOwner {
        systemPaused = _paused;
    }

    /**
     * @dev allows a user to set and unset an operate which can act on their behalf on their vaults. Could be used for rollovers, and more. Only the vault owner can update the operator privileges.
     * @param _operator The operator that msg.sender wants to give privileges to or revoke them from.
     * @param _isOperator The new boolean value that expresses if msg.sender is giving or revoking privileges from _operator.
     */
    function setOperator (address _operator, bool _isOperator) external {
        operators[msg.sender][_operator]  = _isOperator;
        emit NewOperatorSet(_operator);
    }

   /**
    * @dev Iterate through a collateral array of the vault and payout collateral assets.
    * @param _owner The owner of the vault we will clear.
    * @param _id The vaultId for the vault we will clear, within the user's MarginAccount.Account struct.
    */
    function redeemForEmergency(address _owner, vaultId _id) external isPaused isAuthorized(args.owner) {
        //TODO: isn't the second param supposed to be a uint256?
        Vault v = getVault(owner, id);
        v.clearVault();
    }

   /**
    * @dev Return a specific vault from memory.
    * @param _owner The owner of the relevant vault.
    * @param _id The vaultId for the relevant vault, within the user's MarginAccount.Account struct.
    * @return the desired vault
    */
    function getVault(address owner, uint256 vaultId) internal view returns (Vault memory) {
        //return Vault vault = vaults[owner][id] OR  //return accounts[owner].vault[vaultId]
        //todo: which one of the above is it?
    }

    //    /**
    //   * @dev Return a specific vault from memory.?? this is the same as above what?
    //   * @param _owner The owner of the relevant vault.
    //   * @param _id The vaultId for the relevant vault, within the user's MarginAccount.Account struct.
    //   * @return the desired vault
    //   */
    function getVaultBalances(address owner, uint256 vaultId) external view returns (Vault memory) {
        Vault vault = getVault(owner, vaultId);

        //if the vault has no short oToken, return the vault
        if (vault.shortAmount.length == 0) {
            return vault;
        } else {
            if (before Expiry) {
                return vault;
            } else {
                collateralAmount = getExcessMargin(vault, vault.short.collateral);
                return Vault{long, short, collateral: collateralAmount};
                //        Returns format {
                //        longAmounts:[10000000000000000],
                //        shortAmounts:[10000000000000000],
                //        collateralAmounts:[10000000]
            }
        }
    }

    function operate(Action[] actions) external isNotPaused {
        //        Call vault = _runActions (actions) and get the vault
        //        Call Calculator.isValidState(vault)
    }

   /**
    * @dev return if an expired oToken contract’s price has been finalized. Returns true if the contract has expired AND the oraclePrice at the expiry timestamp has been finalized.
    * @param _oToken The address of the relevant oToken.
    * @return A boolean which is true if and only if the price is finalized.
    */
    function isPriceFinalized(address _oToken) external view returns (type bool) {
    //Returns true if the contract has expired AND the oraclePrice at the expiry timestamp has been finalized.
    //Calls the Oracle to know if the price has been finalized
    }

    /**
    * @dev For each action in the action Array, run the corresponding action
    * @param _actions An array of type Actions.ActionsArgs[] which expresses which actions the user wishes to take.
    * @return vault The new vault that has been modified (or null vault if no action affected any vault)
    */
    function _runActions(Actions.ActionsArgs[] _actions) internal return (Vault memory vault) {
        //        Iterate through all the actions
        //        For each action (except settleVault), make sure it’s not manipulating more than 1 vault before expiry
        //        we allow users to pass in multiple settleVault actions
        //        Depending on the type of the action, call the corresponding parse function followed by the action function on the parsed arguments
        //        Return the  vault that has been modified (or null vault if no action affected any vault)

    }

    //    High Level: Only vault operator / user should be able to open a new vault
    function _openVault(Actions.OpenVaultArgs args) internal isAuthorized(args.owner) {
        updateOnOpenVault(args.owner);
    }

    //    High Level: Anyone should be able to deposit a valid option into a vault
    //    Example Input for amounts:
    //    uint256 amount 1000000000000000000;  // 1 * 10^18
    function _depositLong (Actions.DepositArgs args) internal {
        //    Check that not depositing 0 Long options
        //    Check that args.long is WhitelistModule._isValidOToken (args.long)
        //    Check that the long has not expired
        //    Check args.from == msg.sender for this version
        //    run updateOnDepositLong(vault,  longOtoken, amount, index)
        //    amount: 1000000000000000000 (no need to scale)
        //    Call MarginPool.transferToPool(args.asset, args.from, args.amount)
        //    amount: 1000000000000000000 (no need to scale)
    }

    //High Level: Only vault operator / user should be able to withdraw long
    function _withdrawLong (Actions.WithdrawArgs args) internal isAuthorized(args.owner) {
        //Check that not withdrawing 0 Long options
        //Cannot withdraw expired option
        //Run updateOnWithdrawLong(Vault storage _vault, Account storage _account,  address longOtoken, uint256 amount, uint256 index)
        //Call MarginPool.transferToUser(args.asset, args.to, args.amount)
    }

    //    High Level: Anyone should be able to deposit collateral into a vault
    function _depositCollateral (Actions.DepositArgs args) internal {
        //    Ensure that the collateral deposited is a valid collateral type
        //    Check args.from == msg.sender for this version
        //    Check that not depositing 0 Collateral
        //    Ensure that the vault doesn’t have a short oToken which has expired
        //    Example Input for amounts:
        //    uint256 amount 1000000;  // 1 * 10^6 for USDC
        //    run updateOnDepositCollateral(vault, args.asset, args.amount, args.index)
        //    amount: 1000000 (no need to scale)
        //    Call MarginPool.transferToPool(args.asset, args.from, args.amount)
        //    Amount: 1000000 (no need to scale)
    }

    //High Level: Only vault operator / user  should be able to withdraw collateral into a vault
    function _withdrawCollateral (Actions.WithdrawArgs args) internal isAuthorized(args.owner) {
        //Check that not depositing 0 Collateral
        //Ensure that the vault doesn’t have a short oToken which has expired
        //run updateOnWithdrawCollateral(vault, args.asset, args.amount, args.index)
        //Call MarginPool.transferToUser(args.asset, args.to, args.amount)
    }

    //High Level: Only vault operator / user  should be able to mint a new oToken. Add token balance to the vault account, also call Otoken.mint
    //Check that not minting 0 tokens
    //Ensure that the oToken has not expired
    //Example Input for amounts:
    //uint256 amount 1000000000000000000;  // 1 * 10^18
    //call updateOnMintShort(vault, args.asset, args.amount, args.index)
    //amount: 1000000000000000000 (no need to scale)
    //Call Otoken(args.asset).mint(args.from, args.amount)
    //amount: 1000000000000000000 (no need to scale)
    function _mintOtoken (Actions.MintArgs args) internal isAuthorized(args.owner) {

    }

    //High Level: anyone should be able to burn oTokens
    //Check args.from == msg.sender for this version
    //Check that not burning 0 tokens
    //Check that updateOnBurnShort(vault, args.asset, args.amount, args.index) has no error, if not fail and return an error
    //Call Otoken(args.asset).burn(msg.sender, args.amount)
    function _burnOtoken (Actions.BurnArgs args) internal {

    }

    //High Level: Otoken holders can withdraw cash value with their oToken
    function _exercise (Actions.ExerciseArgs args) internal {
        //Ensure the option has expired
        //Check priceIsFinalized()
        //Check oToken.isLocked is false
        //Amount: 1000000000000000000 // 1 * 10 ^ 18 (no need to scale)
        //Call MarginCalculator.getExpiredCashValue(oToken, denominated = USDC)
        //Example cashValue for 1 oToken (option unit): 10.95 USDC, the amount here would be
        //10 950000 // 10.95 * 10^6. Already convert to USDC decimals
        //Calculate payoutPer10e18Otoken = cashValue * amount
        //Payout amount:
        //High level: 1 oToen * 10.95 usd = 10.95 USDC = 10950000 USDC base unit.
        //payoutInUSDC =
        //amount * payoutPer10e18Otoken
        //(10 * 10 ^18).mul (10.95 * 10^6) .div (10^18)
        //Call oToken.burn(amount)
        //MarginPool.transferToUser(payoutInUSDC)
    }

    //High Level: Clean up a vault and get back collateral after expiry.
    function _settleVault (Actions.SettleVaultArg args) internal {
        //Ensure the short oToken has expired
        //Check priceIsFinalized()
        //Check oToken.isLocked is false
        //amountToTakeout = MarginCalculator.getMarginRequirement(vault, collateral)
        //Burn long oTokens
        //Call vault.clearVault()
        //MarginPool.transferToUser(collateral, payout)
    }


    //High Level: call arbitrary smart contract
    function _call (Actions.CallArgs args) internal {
        //Check whitelistModule.isWhitelistCallDestination(args.address)
        //Call args.address with args.data
    }

    /**
    * @dev High Level: Checks if the transaction sender is the operator of the owner’s vault
    * @param _owner The owner of the relevant vault.
    * @param _sender DO WE NEED THIS?
    * @return A boolean which is true if and only if the sender is the operator of the owner's vault.
    */
    function isOperator (address _owner, address _sender) public view returns (type bool) {
        //TODO: do we need the second arg, shouldn't it be msg.sender?!
        //    Return operators[owner][sender]
        //    setProductUnderlyingPrice (address _otoken, uint256 _roundsBack, ) external
        //    Get oToken.strike, oToken.underlying
    }

    /**
    * @dev the oracle sets the price of the underlying of an otoken.
    //TODO: why are we setting price of individual otokens, shouldn't we set for an entire batch at once?
    */
    function setProductUnderlyingPrice (address _otoken, uint256 _roundsBack, ) external {
    //TODO: IS THERE SUPPOSED TO BE ANOTHER param?
        //TODO: why are we setting price of individual otokens, shouldn't we set for an entire batch at once?
        //    Get oToken.strike, oToken.underlying
        //    Get oToken.expiry (expiryTimestamp = oToken.expiry)
        //    Get option hash ( hash (underlying,strike,expiry) )
        //    Check if product is whitelisted (hash of underlying, strike, collateral)
        //    Require that Oracle.getPrice(product, expiryTimestamp) return 0 as price and 0 as on-chain push timestamp
        //    Require that locking period is over for that product
        //    Call oracle.setProductunderlyingPrice()
    }
}
