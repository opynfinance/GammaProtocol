/* eslint-disable */
const yargs = require("yargs");

const Trade0x = artifacts.require("TradeCallee.sol");

module.exports = async function(callback) {
    try {
        const options = yargs
            .usage("Usage: --network <network> --exchange <exchange>  --weth <weth> --controller <controller> --gas <gasPrice>")
            .option("network", { describe: "network name", type: "string", demandOption: true })
            .option("exchange", { describe: "0x exchange address", type: "string", demandOption: true })
            .option("weth", { describe: "WETH address", type: "string", demandOption: true })
            .option("controller", { describe: "controller address", type: "string", demandOption: true })
            .option("gas", { describe: "Gas price in WEI", type: "string", demandOption: true })
            .argv;

    console.log(`Deploying Trade0x callee contract on ${options.network} 🍕`)

    const tx = await Trade0x.new(options.exchange, options.weth, options.controller, {gasPrice: options.gas})

    console.log('Trade0x callee deployed! 🎉')
    console.log(`Transaction hash: ${tx.transactionHash}`)
    console.log(`Deployed contract address: ${tx.address}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
