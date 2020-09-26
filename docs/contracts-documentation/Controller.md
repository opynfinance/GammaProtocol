# `Controller`

contract that controls the gamma protocol and interaction with all sub contracts

## Modifiers:

- `notPaused()`

- `notShutdown()`

- `onlyTerminator()`

- `onlyPauser()`

- `onlyAuthorized(address _sender, address _accountOwner)`

- `onlyWhitelistedCallee(address _callee)`

## Functions:

- `_isNotPaused() (internal)`

- `_isNotShutdown() (internal)`

- `_isAuthorized(address _sender, address _accountOwner) (internal)`

- `initialize(address _addressBook, address _owner) (external)`

- `setSystemPaused(bool _paused) (external)`

- `setEmergencyShutdown(bool _shutdown) (external)`

- `setTerminator(address _terminator) (external)`

- `setPauser(address _pauser) (external)`

- `setCallRestriction(bool _isRestricted) (external)`

- `setOperator(address _operator, bool _isOperator) (external)`

- `refreshConfiguration() (external)`

- `operate(struct Actions.ActionArgs[] _actions) (external)`

- `isOperator(address _owner, address _operator) (external)`

- `getConfiguration() (external)`

- `getProceed(address _owner, uint256 _vaultId) (external)`

- `isSettlementAllowed(address _otoken) (public)`

- `getAccountVaultCounter(address _accountOwner) (external)`

- `isExpired(address _otoken) (public)`

- `getVault(address _owner, uint256 _vaultId) (public)`

- `_runActions(struct Actions.ActionArgs[] _actions) (internal)`

- `_verifyFinalState(address _owner, uint256 _vaultId) (internal)`

- `_openVault(struct Actions.OpenVaultArgs _args) (internal)`

- `_depositLong(struct Actions.DepositArgs _args) (internal)`

- `_withdrawLong(struct Actions.WithdrawArgs _args) (internal)`

- `_depositCollateral(struct Actions.DepositArgs _args) (internal)`

- `_withdrawCollateral(struct Actions.WithdrawArgs _args) (internal)`

- `_mintOtoken(struct Actions.MintArgs _args) (internal)`

- `_burnOtoken(struct Actions.BurnArgs _args) (internal)`

- `_exercise(struct Actions.ExerciseArgs _args) (internal)`

- `_settleVault(struct Actions.SettleVaultArgs _args) (internal)`

- `_call(struct Actions.CallArgs _args) (internal)`

- `_checkVaultId(address _accountOwner, uint256 _vaultId) (internal)`

- `_isNotEmpty(address[] _array) (internal)`

- `_getPayout(address _otoken, uint256 _amount) (internal)`

- `_isCalleeWhitelisted(address _callee) (internal)`

- `_refreshConfigInternal() (internal)`

## Events:

- `AccountOperatorUpdated(address accountOwner, address operator, bool isSet)`

- `VaultOpened(address accountOwner, uint256 vaultId)`

- `LongOtokenDeposited(address otoken, address accountOwner, address from, uint256 vaultId, uint256 amount)`

- `LongOtokenWithdrawed(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

- `CollateralAssetDeposited(address asset, address accountOwner, address from, uint256 vaultId, uint256 amount)`

- `CollateralAssetWithdrawed(address asset, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

- `ShortOtokenMinted(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

- `ShortOtokenBurned(address otoken, address AccountOwner, address from, uint256 vaultId, uint256 amount)`

- `Exercise(address otoken, address exerciser, address receiver, address collateralAsset, uint256 otokenBurned, uint256 payout)`

- `VaultSettled(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 payout)`

- `CallExecuted(address from, address to, address vaultOwner, uint256 vaultId, bytes data)`

- `TerminatorUpdated(address oldTerminator, address newTerminator)`

- `PauserUpdated(address oldPauser, address newPauser)`

- `SystemPaused(bool isActive)`

- `EmergencyShutdown(bool isActive)`

- `CallRestricted(bool isRestricted)`

### Modifier `notPaused()`

modifier to check if the system is not paused

### Modifier `notShutdown()`

modifier to check if the system is not in an emergency shutdown state

### Modifier `onlyTerminator()`

modifier to check if sender is the terminator address

### Modifier `onlyPauser()`

modifier to check if the sender is the pauser address

### Modifier `onlyAuthorized(address _sender, address _accountOwner)`

modifier to check if the sender is an account owner or an approved account operator

#### Parameters:

- `_sender`: sender address

- `_accountOwner`: account owner address

### Modifier `onlyWhitelistedCallee(address _callee)`

modifier to check if the called address is a whitelisted callee address

#### Parameters:

- `_callee`: called address

### Function `_isNotPaused() internal`

check if the system is not paused

### Function `_isNotShutdown() internal`

check if the system is not in an emergency shutdown state

### Function `_isAuthorized(address _sender, address _accountOwner) internal`

check if the sender is an authorized operator

#### Parameters:

- `_sender`: msg.sender

- `_accountOwner`: owner of a vault

### Function `initialize(address _addressBook, address _owner) external`

initalize the deployed contract

#### Parameters:

- `_addressBook`: addressbook module

- `_owner`: account owner address

### Function `setSystemPaused(bool _paused) external`

allows the pauser to toggle the pause variable and pause or unpause the system

can only be called by the pauser

#### Parameters:

- `_paused`: new boolean value to set systemPaused to

### Function `setEmergencyShutdown(bool _shutdown) external`

allows the terminator to toggle the emergency shutdown variable and put the system in an emergency shutdown state or return to a non-emergency shutdown state

can only be called by the terminator

#### Parameters:

- `_shutdown`: new boolean value to set systemShutdown to

### Function `setTerminator(address _terminator) external`

allows the owner to set the terminator address

can only be called by the owner

#### Parameters:

- `_terminator`: new terminator address

### Function `setPauser(address _pauser) external`

allows the owner to set the pauser address

can only be called by the owner

#### Parameters:

- `_pauser`: new pauser address

### Function `setCallRestriction(bool _isRestricted) external`

allows the owner to toggle the restriction on whitelisted call actions and only allow whitelisted call addresses or allow any arbitrary call addresses

can only be called by the owner

#### Parameters:

- `_isRestricted`: new call restriction

### Function `setOperator(address _operator, bool _isOperator) external`

allows a user to give or revoke privileges to an operator which can act on their behalf on their vaults

can only be updated by the vault owner

#### Parameters:

- `_operator`: operator that the sender wants to give privileges to or revoke them from

- `_isOperator`: new boolean value that expresses if the sender is giving or revoking privileges for _operator

### Function `refreshConfiguration() external`

updates the configuration of the controller. can only be called by the owner

### Function `operate(struct Actions.ActionArgs[] _actions) external`

execute a number of actions on specific vaults

can only be called when the system is not shutdown

#### Parameters:

- `_actions`: array of actions arguments

### Function `isOperator(address _owner, address _operator) → bool external`

check if a specific address is an operator for an owner account

#### Parameters:

- `_owner`: account owner address

- `_operator`: account operator address

#### Return Values:

- true if the _operator is an approved operator for the _owner account

### Function `getConfiguration() → address, address, address, address external`

returns the current controller configuration

#### Return Values:

- the address of the whitelist module

- the address of the oracle module

- the address of the calculator module

- the address of the pool module

### Function `getProceed(address _owner, uint256 _vaultId) → struct MarginVault.Vault external`

before expiry or if there is no short oToken in a vault, return a the vault, if the short oToken has expired, adjust the vault collateral balances by the net option proceeds

if vault has no short oToken or the issued oToken is not expired yet, return the vault, else call getExcessCollateral and return it as collateral amount inside Vault struct.

#### Parameters:

- `_owner`: account owner of the vault

- `_vaultId`: vaultId to return balances for

#### Return Values:

- Vault struct with balances

### Function `isSettlementAllowed(address _otoken) → bool public`

return if an expired oToken contract’s settlement price has been finalized

#### Parameters:

- `_otoken`: address of the oToken

#### Return Values:

- true if the oToken has expired AND the oraclePrice at the expiry timestamp has been finalized, otherwise it returns false

### Function `getAccountVaultCounter(address _accountOwner) → uint256 external`

get the number of current vaults for a specified account owner

#### Parameters:

- `_accountOwner`: account owner address

#### Return Values:

- number of vaults

### Function `isExpired(address _otoken) → bool public`

check if an oToken has expired

#### Parameters:

- `_otoken`: oToken address

#### Return Values:

- true if the otoken has expired, otherwise it returns false

### Function `getVault(address _owner, uint256 _vaultId) → struct MarginVault.Vault public`

return a specific vault

#### Parameters:

- `_owner`: account owner

- `_vaultId`: vault id of vault to return

#### Return Values:

- Vault struct that corresponds to the _vaultId of _owner

### Function `_runActions(struct Actions.ActionArgs[] _actions) → bool, address, uint256 internal`

execute a variety of actions

for each action in the action array, execute the corresponding action, only one vault can be modified for all actions except SettleVault, Exercise, and Call

#### Parameters:

- `_actions`: array of type Actions.ActionArgs[], which expresses which actions the user wants to execute

#### Return Values:

- indicates if a vault has changed

- the vault owner if a vault has changed

- the vault Id if a vault has changed

### Function `_verifyFinalState(address _owner, uint256 _vaultId) internal`

verify the vault final state after executing all actions

#### Parameters:

- `_owner`: account owner address

- `_vaultId`: vault id of the final vault

### Function `_openVault(struct Actions.OpenVaultArgs _args) internal`

open a new vault inside an account

only the account owner or operator can open a vault, cannot be called when system is paused or shutdown

#### Parameters:

- `_args`: OpenVaultArgs structure

### Function `_depositLong(struct Actions.DepositArgs _args) internal`

deposit a long oToken into a vault

cannot be called when system is paused or shutdown

#### Parameters:

- `_args`: DepositArgs structure

### Function `_withdrawLong(struct Actions.WithdrawArgs _args) internal`

withdraw a long oToken from a vault

only the account owner or operator can withdraw a long oToken from a vault, cannot be called when system is paused or shutdown

#### Parameters:

- `_args`: WithdrawArgs structure

### Function `_depositCollateral(struct Actions.DepositArgs _args) internal`

deposit a collateral asset into a vault

cannot be called when the system is paused or shutdown

#### Parameters:

- `_args`: DepositArgs structure

### Function `_withdrawCollateral(struct Actions.WithdrawArgs _args) internal`

withdraw a collateral asset from a vault

only the account owner or operator can withdraw a collateral from a vault, cannot be called when system is paused or shutdown

#### Parameters:

- `_args`: WithdrawArgs structure

### Function `_mintOtoken(struct Actions.MintArgs _args) internal`

mint short oTokens from a vault which creates an obligation recorded in a vault

only the account owner or operator can mint short oTokens from a vault, cannot be called when system is paused or shutdown

#### Parameters:

- `_args`: MintArgs structure

### Function `_burnOtoken(struct Actions.BurnArgs _args) internal`

burn oTokens to reduce or remove minted oToken obligation recorded in a vault

only the account owner or operator can burn oTokens for a vault, cannot be called when system is paused or shutdown

#### Parameters:

- `_args`: MintArgs structure

### Function `_exercise(struct Actions.ExerciseArgs _args) internal`

exercise an oToken after expiry, receiving the payout of the oToken in the collateral asset

cannot be called when system is paused

#### Parameters:

- `_args`: ExerciseArgs structure

### Function `_settleVault(struct Actions.SettleVaultArgs _args) internal`

settle a vault after expiry, removing the remaining collateral in a vault after both long and short oToken payouts have been removed

deletes a vault of vaultId after remaining collateral is removed, cannot be called when system is paused

#### Parameters:

- `_args`: SettleVaultArgs structure

### Function `_call(struct Actions.CallArgs _args) internal`

execute arbitrary calls

cannot be called when system is paused or shutdown

#### Parameters:

- `_args`: Call action

### Function `_checkVaultId(address _accountOwner, uint256 _vaultId) → bool internal`

check if a vault id is valid

#### Parameters:

- `_accountOwner`: account owner address

- `_vaultId`: vault id to check

#### Return Values:

- true if the _vaultId is valid, otherwise it returns falue

### Function `_isNotEmpty(address[] _array) → bool internal`

### Function `_getPayout(address _otoken, uint256 _amount) → uint256 internal`

get the oToken's payout after expiry, in the collateral asset

#### Parameters:

- `_otoken`: oToken address

- `_amount`: amount of the oToken to calculate the payout for, always represented in 1e18

#### Return Values:

- amount of collateral to pay out

### Function `_isCalleeWhitelisted(address _callee) → bool internal`

return if a callee address is whitelisted or not

#### Parameters:

- `_callee`: callee address

#### Return Values:

- true if callee address is whitelisted, otherwise false

### Function `_refreshConfigInternal() internal`

updates the internal configuration of the controller

### Event `AccountOperatorUpdated(address accountOwner, address operator, bool isSet)`

emits an event when an account operator is updated for a specific account owner

### Event `VaultOpened(address accountOwner, uint256 vaultId)`

emits an event when a new vault is opened

### Event `LongOtokenDeposited(address otoken, address accountOwner, address from, uint256 vaultId, uint256 amount)`

emits an event when a long oToken is deposited into a vault

### Event `LongOtokenWithdrawed(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

emits an event when a long oToken is withdrawn from a vault

### Event `CollateralAssetDeposited(address asset, address accountOwner, address from, uint256 vaultId, uint256 amount)`

emits an event when a collateral asset is deposited into a vault

### Event `CollateralAssetWithdrawed(address asset, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

emits an event when a collateral asset is withdrawn from a vault

### Event `ShortOtokenMinted(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

emits an event when a short oToken is minted from a vault

### Event `ShortOtokenBurned(address otoken, address AccountOwner, address from, uint256 vaultId, uint256 amount)`

emits an event when a short oToken is burned

### Event `Exercise(address otoken, address exerciser, address receiver, address collateralAsset, uint256 otokenBurned, uint256 payout)`

emits an event when an oToken is exercised

### Event `VaultSettled(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 payout)`

emits an event when a vault is settled

### Event `CallExecuted(address from, address to, address vaultOwner, uint256 vaultId, bytes data)`

emits an event when a call action is executed

### Event `TerminatorUpdated(address oldTerminator, address newTerminator)`

emits an event when the terminator address changes

### Event `PauserUpdated(address oldPauser, address newPauser)`

emits an event when the pauser address changes

### Event `SystemPaused(bool isActive)`

emits an event when the system paused status changes

### Event `EmergencyShutdown(bool isActive)`

emits an event when the system emergency shutdown status changes

### Event `CallRestricted(bool isRestricted)`

emits an event when the call action restriction changes
