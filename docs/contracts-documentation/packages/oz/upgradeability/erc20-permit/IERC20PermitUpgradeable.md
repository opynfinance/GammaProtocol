# `IERC20PermitUpgradeable`

Interface of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in

https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].

Adds the {permit} method, which can be used to change an account's ERC20 allowance (see {IERC20-allowance}) by

presenting a message signed by the account. By not relying on `{IERC20-approve}`, the token holder account doesn't

need to send a transaction, and thus is not required to hold Ether at all.

## Functions:

- `permit(address owner, address spender, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) (external)`

- `nonces(address owner) (external)`

- `DOMAIN_SEPARATOR() (external)`

### Function `permit(address owner, address spender, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external`

Sets `amount` as the allowance of `spender` over `owner`'s tokens,

given `owner`'s signed approval.

IMPORTANT: The same issues {IERC20-approve} has related to transaction

ordering also apply here.

Emits an {Approval} event.

Requirements:

- `spender` cannot be the zero address.

- `deadline` must be a timestamp in the future.

- `v`, `r` and `s` must be a valid `secp256k1` signature from `owner`

over the EIP712-formatted function arguments.

- the signature must use ``owner``'s current nonce (see {nonces}).

For more information on the signature format, see the

https://eips.ethereum.org/EIPS/eip-2612#specification[relevant EIP

section].

### Function `nonces(address owner) → uint256 external`

Returns the current nonce for `owner`. This value must be

included whenever a signature is generated for {permit}.

Every successful call to {permit} increases ``owner``'s nonce by one. This

prevents a signature from being used multiple times.

### Function `DOMAIN_SEPARATOR() → bytes32 external`

Returns the domain separator used in the encoding of the signature for `permit`, as defined by {EIP712}.
