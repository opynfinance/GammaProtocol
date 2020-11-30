sleep 10 && node --max-old-space-size=4096 $(npm bin)/truffle test ./test/e2e/*.ts && kill $(lsof -t -i:8545)
