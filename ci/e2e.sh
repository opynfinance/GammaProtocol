sleep 10 && truffle test ./test/e2e/*.ts && kill $(lsof -t -i:8545)
