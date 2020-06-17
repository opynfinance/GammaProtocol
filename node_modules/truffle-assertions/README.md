# truffle-assertions

[![Build Status](https://travis-ci.org/rkalis/truffle-assertions.svg)](https://travis-ci.org/rkalis/truffle-assertions)
[![Coverage Status](https://img.shields.io/codecov/c/github/rkalis/truffle-assertions.svg)](https://codecov.io/gh/rkalis/truffle-assertions/)
[![NPM Version](https://img.shields.io/npm/v/truffle-assertions.svg)](https://www.npmjs.com/package/truffle-assertions)
[![NPM Monthly Downloads](https://img.shields.io/npm/dm/truffle-assertions.svg)](https://www.npmjs.com/package/truffle-assertions)
[![NPM License](https://img.shields.io/npm/l/truffle-assertions.svg)](https://www.npmjs.com/package/truffle-assertions)

This package adds additional assertions that can be used to test Ethereum smart contracts inside Truffle tests.

## Installation
truffle-assertions can be installed through npm:
```bash
npm install truffle-assertions
```

## Usage
To use this package, import it at the top of the Truffle test file, and use the functions that are documented below.
```javascript
const truffleAssert = require('truffle-assertions');
```

## Tutorials
I wrote two tutorials on using this library for checking events and asserting reverts inside smart contract tests:
* [Checking events when testing Solidity smart contracts with Truffle](https://kalis.me/check-events-solidity-smart-contract-test-truffle/)
* [Asserting reverts when testing Solidity smart contracts with Truffle](https://kalis.me/assert-reverts-solidity-smart-contract-test-truffle/)

I also gave a two talks that explain a few different use cases of the library:
* [TruffleCon 2018: Using events to unit test smart contracts with Truffle](https://youtu.be/0yjlU1vx0HM) ([Slides](/docs/trufflecon-2018-presentation-slides.pdf))
* [EthCC 2019: Using events to unit test smart contracts](https://youtu.be/GON3qyFdUtE) ([Slides](/docs/ethcc-2019-presentation-slides.pdf))

## Exported functions

### truffleAssert.eventEmitted(result, eventType\[, filter]\[, message])
The `eventEmitted` assertion checks that an event with type `eventType` has been emitted by the transaction with result `result`. A filter function can be passed along to further specify requirements for the event arguments:

```javascript
truffleAssert.eventEmitted(result, 'TestEvent', (ev) => {
    return ev.param1 === 10 && ev.param2 === ev.param3;
});
```

Alternatively, a filter object can be passed in place of a function. If an object is passed, this object will be matched against the event's arguments. This object does not need to include all the event's arguments; only the included ones will be used in the comparison.

```javascript
truffleAssert.eventEmitted(result, 'TestEvent', { param1: 10, param2: 20 });
```

When the `filter` parameter is omitted or set to null, the assertion checks just for event type:

```javascript
truffleAssert.eventEmitted(result, 'TestEvent');
```

Optionally, a custom message can be passed to the assertion, which will be displayed alongside the default one:

```javascript
truffleAssert.eventEmitted(result, 'TestEvent', (ev) => {
    return ev.param1 === 10 && ev.param2 === ev.param3;
}, 'TestEvent should be emitted with correct parameters');
```

The default messages are
```javascript
`Event of type ${eventType} was not emitted`
`Event filter for ${eventType} returned no results`
```
Depending on the reason for the assertion failure. The default message also includes a list of events that were emitted in the passed transaction.

---

### truffleAssert.eventNotEmitted(result, eventType\[, filter]\[, message])
The `eventNotEmitted` assertion checks that an event with type `eventType` has not been emitted by the transaction with result `result`. A filter function can be passed along to further specify requirements for the event arguments:

```javascript
truffleAssert.eventNotEmitted(result, 'TestEvent', (ev) => {
    return ev.param1 === 10 && ev.param2 === ev.param3;
});
```

Alternatively, a filter object can be passed in place of a function. If an object is passed, this object will be matched against the event's arguments. This object does not need to include all the event's arguments; only the included ones will be used in the comparison.

```javascript
truffleAssert.eventNotEmitted(result, 'TestEvent', { param1: 10, param2: 20 });
```

When the `filter` parameter is omitted or set to null, the assertion checks just for event type:

```javascript
truffleAssert.eventNotEmitted(result, 'TestEvent');
```

Optionally, a custom message can be passed to the assertion, which will be displayed alongside the default one:

```javascript
truffleAssert.eventNotEmitted(result, 'TestEvent', null, 'TestEvent should not be emitted');
```

The default messages are
```javascript
`Event of type ${eventType} was emitted`
`Event filter for ${eventType} returned results`
```
Depending on the reason for the assertion failure. The default message also includes a list of events that were emitted in the passed transaction.

---

### truffleAssert.prettyPrintEmittedEvents(result)
Pretty prints the full list of events with their parameters, that were emitted in transaction with result `result`

```javascript
truffleAssert.prettyPrintEmittedEvents(result);
```
```
Events emitted in tx 0x7da28cf2bd52016ee91f10ec711edd8aa2716aac3ed453b0def0af59991d5120:
----------------------------------------------------------------------------------------
TestEvent(testAddress = 0xe04893f0a1bdb132d66b4e7279492fcfe602f0eb, testInt: 10)
----------------------------------------------------------------------------------------
```

---

### truffleAssert.createTransactionResult(contract, transactionHash)
There can be times where we only have access to a transaction hash, and not to a transaction result object, such as with the deployment of a new contract instance using `Contract.new();`. In these cases we still want to be able to assert that certain events are or aren't emitted.

`truffle-assertions` offers the possibility to create a transaction result object from a contract instance and a transaction hash, which can then be used in the other functions that the library offers.

**Note:** This function assumes that web3 is injected into the tests, which truffle does automatically. If you're not using truffle, you should import web3 manually at the top of your test file.

```javascript
let contractInstance = await Contract.new();
let result = await truffleAssert.createTransactionResult(contractInstance, contractInstance.transactionHash);

truffleAssert.eventEmitted(result, 'TestEvent');
```

---

### truffleAssert.passes(asyncFn\[, message])
Asserts that the passed async contract function does not fail.

```javascript
await truffleAssert.passes(
    contractInstance.methodThatShouldPass()
);
```

Optionally, a custom message can be passed to the assertion, which will be displayed alongside the default one:

```javascript
await truffleAssert.passes(
    contractInstance.methodThatShouldPass(),
    'This method should not run out of gas'
);
```

The default message is
```javascript
`Failed with ${error}`
```

---

### truffleAssert.fails(asyncFn\[, errorType]\[, reason]\[, message])
Asserts that the passed async contract function fails with a certain ErrorType and reason.

The different error types are defined as follows:
```javascript
ErrorType = {
  REVERT: "revert",
  INVALID_OPCODE: "invalid opcode",
  OUT_OF_GAS: "out of gas",
  INVALID_JUMP: "invalid JUMP"
}
```

```javascript
await truffleAssert.fails(
    contractInstance.methodThatShouldFail(),
    truffleAssert.ErrorType.OUT_OF_GAS
);
```

A reason can be passed to the assertion, which functions as an extra filter on the revert reason (note that this is only relevant in the case of revert, not for the other ErrorTypes). This functionality requires at least Truffle v0.5.

```javascript
await truffleAssert.fails(
    contractInstance.methodThatShouldFail(),
    truffleAssert.ErrorType.REVERT,
    "only owner"
);
```

If the errorType parameter is omitted or set to null, the function just checks for failure, regardless of cause.

```javascript
await truffleAssert.fails(contractInstance.methodThatShouldFail());
```

Optionally, a custom message can be passed to the assertion, which will be displayed alongside the default one:

```javascript
await truffleAssert.fails(
    contractInstance.methodThatShouldFail(),
    truffleAssert.ErrorType.OUT_OF_GAS,
    null,
    'This method should run out of gas'
);
```

The default messages are
```javascript
'Did not fail'
`Expected to fail with ${errorType}, but failed with: ${error}`
```

---

### truffleAssert.reverts(asyncFn\[, reason]\[, message])
This is an alias for `truffleAssert.fails(asyncFn, truffleAssert.ErrorType.REVERT[, reason][, message])`.

```javascript
await truffleAssert.reverts(
    contractInstance.methodThatShouldRevert(),
    "only owner"
);
```

## Related projects

* [truffle-events](https://github.com/zulhfreelancer/truffle-events) — 3rd party add-on to this project with 'deep events' support. You can test emitted events in other contracts, provided they are in the same transaction i.e. event A (contract A) and event B (contract B) are produced in the same transaction.

## Donations
If you use this library inside your own projects and you would like to support its development, you can donate Ξ to `0x6775f0Ee4E63983501DBE7b0385bF84DBd36D69B`.
