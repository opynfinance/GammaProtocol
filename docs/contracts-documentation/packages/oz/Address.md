# `Address`

Collection of functions related to the address type

## Functions:

- `isContract(address account) (internal)`

- `sendValue(address payable recipient, uint256 amount) (internal)`

- `functionCall(address target, bytes data) (internal)`

- `functionCall(address target, bytes data, string errorMessage) (internal)`

- `functionCallWithValue(address target, bytes data, uint256 value) (internal)`

- `functionCallWithValue(address target, bytes data, uint256 value, string errorMessage) (internal)`

### Function `isContract(address account) → bool internal`

Returns true if `account` is a contract.

[IMPORTANT]

====

It is unsafe to assume that an address for which this function returns

false is an externally-owned account (EOA) and not a contract.

Among others, `isContract` will return false for the following

types of addresses:

- an externally-owned account

- a contract in construction

- an address where a contract will be created

- an address where a contract lived, but was destroyed

====

### Function `sendValue(address payable recipient, uint256 amount) internal`

Replacement for Solidity's `transfer`: sends `amount` wei to

`recipient`, forwarding all available gas and reverting on errors.

https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost

of certain opcodes, possibly making contracts go over the 2300 gas limit

imposed by `transfer`, making them unable to receive funds via

`transfer`. {sendValue} removes this limitation.

https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].

IMPORTANT: because control is transferred to `recipient`, care must be

taken to not create reentrancy vulnerabilities. Consider using

{ReentrancyGuard} or the

https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].

### Function `functionCall(address target, bytes data) → bytes internal`

Performs a Solidity function call using a low level `call`. A

plain`call` is an unsafe replacement for a function call: use this

function instead.

If `target` reverts with a revert reason, it is bubbled up by this

function (like regular Solidity function calls).

Returns the raw returned data. To convert to the expected return value,

use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].

Requirements:

- `target` must be a contract.

- calling `target` with `data` must not revert.

_Available since v3.1._

### Function `functionCall(address target, bytes data, string errorMessage) → bytes internal`

Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with

`errorMessage` as a fallback revert reason when `target` reverts.

_Available since v3.1._

### Function `functionCallWithValue(address target, bytes data, uint256 value) → bytes internal`

Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],

but also transferring `value` wei to `target`.

Requirements:

- the calling contract must have an ETH balance of at least `value`.

- the called Solidity function must be `payable`.

_Available since v3.1._

### Function `functionCallWithValue(address target, bytes data, uint256 value, string errorMessage) → bytes internal`

Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but

with `errorMessage` as a fallback revert reason when `target` reverts.

_Available since v3.1._
