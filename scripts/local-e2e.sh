#!/bin/bash

export INFURA_KEY=$(cat .infuraKey)

./ci/e2e.sh && kill $(lsof -t -i:8545)