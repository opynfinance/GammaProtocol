# Functions:

- [`initialize(address _addressBook, address _owner)`](#Controller-initialize-address-address-)

- [`setSystemPaused(bool _paused)`](#Controller-setSystemPaused-bool-)

- [`setEmergencyShutdown(bool _shutdown)`](#Controller-setEmergencyShutdown-bool-)

- [`setTerminator(address _terminator)`](#Controller-setTerminator-address-)

- [`setPauser(address _pauser)`](#Controller-setPauser-address-)

- [`setCallRestriction(bool _isRestricted)`](#Controller-setCallRestriction-bool-)

- [`setOperator(address _operator, bool _isOperator)`](#Controller-setOperator-address-bool-)

- [`refreshConfiguration()`](#Controller-refreshConfiguration--)

- [`operate(struct Actions.ActionArgs[] _actions)`](#Controller-operate-struct-Actions-ActionArgs---)

- [`isOperator(address _owner, address _operator)`](#Controller-isOperator-address-address-)

- [`getConfiguration()`](#Controller-getConfiguration--)

- [`getVaultBalances(address _owner, uint256 _vaultId)`](#Controller-getVaultBalances-address-uint256-)

- [`isPriceFinalized(address _otoken)`](#Controller-isPriceFinalized-address-)

- [`getAccountVaultCounter(address _accountOwner)`](#Controller-getAccountVaultCounter-address-)

- [`isExpired(address _otoken)`](#Controller-isExpired-address-)

- [`getVault(address _owner, uint256 _vaultId)`](#Controller-getVault-address-uint256-)

# Events:

- [`AccountOperatorUpdated(address accountOwner, address operator, bool isSet)`](#Controller-AccountOperatorUpdated-address-address-bool-)

- [`VaultOpened(address accountOwner, uint256 vaultId)`](#Controller-VaultOpened-address-uint256-)

- [`LongOtokenDeposited(address otoken, address accountOwner, address from, uint256 vaultId, uint256 amount)`](#Controller-LongOtokenDeposited-address-address-address-uint256-uint256-)

- [`LongOtokenWithdrawed(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`](#Controller-LongOtokenWithdrawed-address-address-address-uint256-uint256-)

- [`CollateralAssetDeposited(address asset, address accountOwner, address from, uint256 vaultId, uint256 amount)`](#Controller-CollateralAssetDeposited-address-address-address-uint256-uint256-)

- [`CollateralAssetWithdrawed(address asset, address AccountOwner, address to, uint256 vaultId, uint256 amount)`](#Controller-CollateralAssetWithdrawed-address-address-address-uint256-uint256-)

- [`ShortOtokenMinted(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`](#Controller-ShortOtokenMinted-address-address-address-uint256-uint256-)

- [`ShortOtokenBurned(address otoken, address AccountOwner, address from, uint256 vaultId, uint256 amount)`](#Controller-ShortOtokenBurned-address-address-address-uint256-uint256-)

- [`Exercise(address otoken, address exerciser, address receiver, address collateralAsset, uint256 otokenBurned, uint256 payout)`](#Controller-Exercise-address-address-address-address-uint256-uint256-)

- [`VaultSettled(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 payout)`](#Controller-VaultSettled-address-address-address-uint256-uint256-)

- [`CallExecuted(address from, address to, address vaultOwner, uint256 vaultId, bytes data)`](#Controller-CallExecuted-address-address-address-uint256-bytes-)

- [`TerminatorUpdated(address oldTerminator, address newTerminator)`](#Controller-TerminatorUpdated-address-address-)

- [`PauserUpdated(address oldPauser, address newPauser)`](#Controller-PauserUpdated-address-address-)

- [`SystemPaused(bool isActive)`](#Controller-SystemPaused-bool-)

- [`EmergencyShutdown(bool isActive)`](#Controller-EmergencyShutdown-bool-)

- [`CallRestricted(bool isRestricted)`](#Controller-CallRestricted-bool-)

# Function `initialize(address _addressBook, address _owner)` {#Controller-initialize-address-address-}

No description

## Parameters:

- `_addressBook`: addressbook module

- `_owner`: account owner address

# Function `setSystemPaused(bool _paused)` {#Controller-setSystemPaused-bool-}

can only be called by the pauser

## Parameters:

- `_paused`: new boolean value to set systemPaused to

# Function `setEmergencyShutdown(bool _shutdown)` {#Controller-setEmergencyShutdown-bool-}

can only be called by the terminator

## Parameters:

- `_shutdown`: new boolean value to set systemShutdown to

# Function `setTerminator(address _terminator)` {#Controller-setTerminator-address-}

can only be called by the owner

## Parameters:

- `_terminator`: new terminator address

# Function `setPauser(address _pauser)` {#Controller-setPauser-address-}

can only be called by the owner

## Parameters:

- `_pauser`: new pauser address

# Function `setCallRestriction(bool _isRestricted)` {#Controller-setCallRestriction-bool-}

can only be called by the owner

## Parameters:

- `_isRestricted`: new call restriction

# Function `setOperator(address _operator, bool _isOperator)` {#Controller-setOperator-address-bool-}

can only be updated by the vault owner

## Parameters:

- `_operator`: operator that the sender wants to give privileges to or revoke them from

- `_isOperator`: new boolean value that expresses if the sender is giving or revoking privileges for _operator

# Function `refreshConfiguration()` {#Controller-refreshConfiguration--}

updates the configuration of the controller. can only be called by the owner

# Function `operate(struct Actions.ActionArgs[] _actions)` {#Controller-operate-struct-Actions-ActionArgs---}

can only be called when the system is not shutdown

## Parameters:

- `_actions`: array of actions arguments

# Function `isOperator(address _owner, address _operator) → bool` {#Controller-isOperator-address-address-}

No description

## Parameters:

- `_owner`: account owner address

- `_operator`: account operator address

## Return Values:

- true if the _operator is an approved operator for the _owner account

# Function `getConfiguration() → address, address, address, address` {#Controller-getConfiguration--}

No description

## Return Values:

- the address of the whitelist module

- the address of the oracle module

- the address of the calculator module

- the address of the pool module

# Function `getVaultBalances(address _owner, uint256 _vaultId) → struct MarginAccount.Vault` {#Controller-getVaultBalances-address-uint256-}

if vault has no short oToken or the issued oToken is not expired yet, return the vault, else call getExcessCollateral and return it as collateral amount inside Vault struct.

## Parameters:

- `_owner`: account owner of the vault

- `_vaultId`: vaultId to return balances for

## Return Values:

- Vault struct with balances

# Function `isPriceFinalized(address _otoken) → bool` {#Controller-isPriceFinalized-address-}

return if an expired oToken contract’s settlement price has been finalized

## Parameters:

- `_otoken`: address of the oToken

## Return Values:

- true if the oToken has expired AND the oraclePrice at the expiry timestamp has been finalized, otherwise it returns false

# Function `getAccountVaultCounter(address _accountOwner) → uint256` {#Controller-getAccountVaultCounter-address-}

No description

## Parameters:

- `_accountOwner`: account owner address

## Return Values:

- number of vaults

# Function `isExpired(address _otoken) → bool` {#Controller-isExpired-address-}

No description

## Parameters:

- `_otoken`: oToken address

## Return Values:

- true if the otoken has expired, otherwise it returns false

# Function `getVault(address _owner, uint256 _vaultId) → struct MarginAccount.Vault` {#Controller-getVault-address-uint256-}

No description

## Parameters:

- `_owner`: account owner

- `_vaultId`: vault id of vault to return

## Return Values:

- Vault struct that corresponds to the _vaultId of _owner

# Event `AccountOperatorUpdated(address accountOwner, address operator, bool isSet)` {#Controller-AccountOperatorUpdated-address-address-bool-}

No description

# Event `VaultOpened(address accountOwner, uint256 vaultId)` {#Controller-VaultOpened-address-uint256-}

No description

# Event `LongOtokenDeposited(address otoken, address accountOwner, address from, uint256 vaultId, uint256 amount)` {#Controller-LongOtokenDeposited-address-address-address-uint256-uint256-}

No description

# Event `LongOtokenWithdrawed(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)` {#Controller-LongOtokenWithdrawed-address-address-address-uint256-uint256-}

No description

# Event `CollateralAssetDeposited(address asset, address accountOwner, address from, uint256 vaultId, uint256 amount)` {#Controller-CollateralAssetDeposited-address-address-address-uint256-uint256-}

No description

# Event `CollateralAssetWithdrawed(address asset, address AccountOwner, address to, uint256 vaultId, uint256 amount)` {#Controller-CollateralAssetWithdrawed-address-address-address-uint256-uint256-}

No description

# Event `ShortOtokenMinted(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)` {#Controller-ShortOtokenMinted-address-address-address-uint256-uint256-}

No description

# Event `ShortOtokenBurned(address otoken, address AccountOwner, address from, uint256 vaultId, uint256 amount)` {#Controller-ShortOtokenBurned-address-address-address-uint256-uint256-}

No description

# Event `Exercise(address otoken, address exerciser, address receiver, address collateralAsset, uint256 otokenBurned, uint256 payout)` {#Controller-Exercise-address-address-address-address-uint256-uint256-}

No description

# Event `VaultSettled(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 payout)` {#Controller-VaultSettled-address-address-address-uint256-uint256-}

No description

# Event `CallExecuted(address from, address to, address vaultOwner, uint256 vaultId, bytes data)` {#Controller-CallExecuted-address-address-address-uint256-bytes-}

No description

# Event `TerminatorUpdated(address oldTerminator, address newTerminator)` {#Controller-TerminatorUpdated-address-address-}

No description

# Event `PauserUpdated(address oldPauser, address newPauser)` {#Controller-PauserUpdated-address-address-}

No description

# Event `SystemPaused(bool isActive)` {#Controller-SystemPaused-bool-}

No description

# Event `EmergencyShutdown(bool isActive)` {#Controller-EmergencyShutdown-bool-}

No description

# Event `CallRestricted(bool isRestricted)` {#Controller-CallRestricted-bool-}

No description
