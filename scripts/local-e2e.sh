#!/bin/sh

export INFURA_KEY=$(cat .infuraKey)

./ci/e2e.sh