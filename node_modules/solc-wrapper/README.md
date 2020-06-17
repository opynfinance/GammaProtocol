# solc-js-wrapper

```
npm install solc-wrapper
```

JavaScript bindings for the [Solidity compiler](https://github.com/ethereum/solidity).

Wraps the Emscripten compiled Solidity found in the [solc-bin repository](https://github.com/ethereum/solc-bin).

**This is a fork of the original project [solc-js](https://github.com/ethereum/solc-js)**, with the difference that it removes the binary `solc`, and does not bundle any emscripten version by default. It is intended to be used from code only, and not from the command line.

It exports the `wrapper` function that receives the emscripten binary and returns the js friendly wrapper.
