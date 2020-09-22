# Functions:

- [`initialize(address _addressBook, address _owner)`]

- [`setSystemPaused(bool _paused)`]

- [`setEmergencyShutdown(bool _shutdown)`]

- [`setTerminator(address _terminator)`]

- [`setPauser(address _pauser)`]

- [`setCallRestriction(bool _isRestricted)`]

- [`setOperator(address _operator, bool _isOperator)`]

- [`refreshConfiguration()`]

- [`operate(struct Actions.ActionArgs[] _actions)`]

- [`isOperator(address _owner, address _operator)`]

- [`getConfiguration()`]

- [`getVaultBalances(address _owner, uint256 _vaultId)`]

- [`isPriceFinalized(address _otoken)`]

- [`getAccountVaultCounter(address _accountOwner)`]

- [`isExpired(address _otoken)`]

- [`getVault(address _owner, uint256 _vaultId)`]

# Events:

- [`AccountOperatorUpdated(address accountOwner, address operator, bool isSet)`]

- [`VaultOpened(address accountOwner, uint256 vaultId)`]

- [`LongOtokenDeposited(address otoken, address accountOwner, address from, uint256 vaultId, uint256 amount)`]

- [`LongOtokenWithdrawed(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`]

- [`CollateralAssetDeposited(address asset, address accountOwner, address from, uint256 vaultId, uint256 amount)`]

- [`CollateralAssetWithdrawed(address asset, address AccountOwner, address to, uint256 vaultId, uint256 amount)`]

- [`ShortOtokenMinted(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`]

- [`ShortOtokenBurned(address otoken, address AccountOwner, address from, uint256 vaultId, uint256 amount)`]

- [`Exercise(address otoken, address exerciser, address receiver, address collateralAsset, uint256 otokenBurned, uint256 payout)`]

- [`VaultSettled(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 payout)`]

- [`CallExecuted(address from, address to, address vaultOwner, uint256 vaultId, bytes data)`]

- [`TerminatorUpdated(address oldTerminator, address newTerminator)`]

- [`PauserUpdated(address oldPauser, address newPauser)`]

- [`SystemPaused(bool isActive)`]

- [`EmergencyShutdown(bool isActive)`]

- [`CallRestricted(bool isRestricted)`]

# Function `initialize(address _addressBook, address _owner)`

No description

## Parameters:

- `_addressBook`: addressbook module

- `_owner`: account owner address

# Function `setSystemPaused(bool _paused)`

can only be called by the pauser

## Parameters:

- `_paused`: new boolean value to set systemPaused to

# Function `setEmergencyShutdown(bool _shutdown)`

can only be called by the terminator

## Parameters:

- `_shutdown`: new boolean value to set systemShutdown to

# Function `setTerminator(address _terminator)`

can only be called by the owner

## Parameters:

- `_terminator`: new terminator address

# Function `setPauser(address _pauser)`

can only be called by the owner

## Parameters:

- `_pauser`: new pauser address

# Function `setCallRestriction(bool _isRestricted)`

can only be called by the owner

## Parameters:

- `_isRestricted`: new call restriction

# Function `setOperator(address _operator, bool _isOperator)`

can only be updated by the vault owner

## Parameters:

- `_operator`: operator that the sender wants to give privileges to or revoke them from

- `_isOperator`: new boolean value that expresses if the sender is giving or revoking privileges for _operator

# Function `refreshConfiguration()`

updates the configuration of the controller. can only be called by the owner

# Function `operate(struct Actions.ActionArgs[] _actions)`

can only be called when the system is not shutdown

## Parameters:

- `_actions`: array of actions arguments

# Function `isOperator(address _owner, address _operator) → bool`

No description

## Parameters:

- `_owner`: account owner address

- `_operator`: account operator address

## Return Values:

- true if the _operator is an approved operator for the _owner account

# Function `getConfiguration() → address, address, address, address`

No description

## Return Values:

- the address of the whitelist module

- the address of the oracle module

- the address of the calculator module

- the address of the pool module

# Function `getVaultBalances(address _owner, uint256 _vaultId) → struct MarginAccount.Vault`

if vault has no short oToken or the issued oToken is not expired yet, return the vault, else call getExcessCollateral and return it as collateral amount inside Vault struct.

## Parameters:

- `_owner`: account owner of the vault

- `_vaultId`: vaultId to return balances for

## Return Values:

- Vault struct with balances

# Function `isPriceFinalized(address _otoken) → bool`

return if an expired oToken contract’s settlement price has been finalized

## Parameters:

- `_otoken`: address of the oToken

## Return Values:

- true if the oToken has expired AND the oraclePrice at the expiry timestamp has been finalized, otherwise it returns false

# Function `getAccountVaultCounter(address _accountOwner) → uint256`

No description

## Parameters:

- `_accountOwner`: account owner address

## Return Values:

- number of vaults

# Function `isExpired(address _otoken) → bool`

No description

## Parameters:

- `_otoken`: oToken address

## Return Values:

- true if the otoken has expired, otherwise it returns false

# Function `getVault(address _owner, uint256 _vaultId) → struct MarginAccount.Vault`

No description

## Parameters:

- `_owner`: account owner

- `_vaultId`: vault id of vault to return

## Return Values:

- Vault struct that corresponds to the _vaultId of _owner

# Event `AccountOperatorUpdated(address accountOwner, address operator, bool isSet)`

No description

# Event `VaultOpened(address accountOwner, uint256 vaultId)`

No description

# Event `LongOtokenDeposited(address otoken, address accountOwner, address from, uint256 vaultId, uint256 amount)`

No description

# Event `LongOtokenWithdrawed(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

No description

# Event `CollateralAssetDeposited(address asset, address accountOwner, address from, uint256 vaultId, uint256 amount)`

No description

# Event `CollateralAssetWithdrawed(address asset, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

No description

# Event `ShortOtokenMinted(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

No description

# Event `ShortOtokenBurned(address otoken, address AccountOwner, address from, uint256 vaultId, uint256 amount)`

No description

# Event `Exercise(address otoken, address exerciser, address receiver, address collateralAsset, uint256 otokenBurned, uint256 payout)`

No description

# Event `VaultSettled(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 payout)`

No description

# Event `CallExecuted(address from, address to, address vaultOwner, uint256 vaultId, bytes data)`

No description

# Event `TerminatorUpdated(address oldTerminator, address newTerminator)`

No description

# Event `PauserUpdated(address oldPauser, address newPauser)`

No description

# Event `SystemPaused(bool isActive)`

No description

# Event `EmergencyShutdown(bool isActive)`

No description

# Event `CallRestricted(bool isRestricted)`

No description
