const yargs = require("yargs");

const PayableProxyController = artifacts.require("PayableProxyController.sol");

module.exports = async function(callback) {
    try {
        const options = yargs
            .usage("Usage: --network <network> --controller <controller> --pool <pool> --weth <weth> --gas <gasPrice>")
            .option("network", { describe: "Network name", type: "string", demandOption: true })
            .option("controller", { describe: "Controller proxy address", type: "string", demandOption: true })
            .option("pool", { describe: "Margin pool address", type: "string", demandOption: true })
            .option("weth", { describe: "WETH token address", type: "string", demandOption: true })
            .option("gas", { describe: "Gas pricer in GWEI", type: "string", demandOption: false })
            .argv;

        console.log(`Deploying payable proxy contract on ${options.network} 🍕`)

        const tx = await PayableProxyController.new(options.controller, options.pool, options.weth, {gasPrice: options.gas});

        console.log("Payable proxy contract deployed! 🎉");
        console.log(`Transaction hash: ${tx.transactionHash}`);
        console.log(`Deployed contract address: ${tx.address}`);

        callback();
    }
    catch(err) {
        callback(err);
    }
} 
