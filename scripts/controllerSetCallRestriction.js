const yargs = require("yargs");

const Controller = artifacts.require("Controller.sol");

module.exports = async function(callback) {
    try {
        const options = yargs
            .usage("Usage: --network <network> --controller <controller> --restriction <true/false> --gas <gasPrice>")
            .option("network", { describe: "Network name", type: "string", demandOption: true })
            .option("controller", { describe: "Controller contract address", type: "string", demandOption: true })
            .option("restriction", { describe: "Set call restriction to true or false", type: "boolean", demandOption: true })
            .option("gas", { describe: "Gas price in WEI", type: "string", demandOption: false })
            .argv;

        console.log(`Executing transaction on ${options.network} 🍕`)

        const controller = await Controller.at(options.controller);

        const tx = await controller.setCallRestriction(options.restriction, {gasPrice: options.gas});

        console.log("Done! 🎉");
        console.log(`Call action restriction set to: ${await controller.callRestricted()} at TX hash ${tx.tx}`);

        callback();
    }
    catch(err) {
        callback(err);
    }
} 
