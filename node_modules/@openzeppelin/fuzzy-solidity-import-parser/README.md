# Fuzzy Solidity Import Parser

This is an experiment in optimizing the parsing of Solidity files when the sole
purpose is to get dependencies before sending it off to `solc` to compile.
Thus, we rely on the compiler to detect any syntax errors, and in that case the
library can return "false positives". The user of this library is meant to
ignore errors when reading files from disk, and let the compiler report them.
