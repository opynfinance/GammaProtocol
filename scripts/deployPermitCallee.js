const yargs = require("yargs");

const PermitCallee = artifacts.require("PermitCallee.sol");

module.exports = async function(callback) {
    try {
        const options = yargs
            .usage("Usage: --network <network> --gas <gasPrice>")
            .option("network", { describe: "0x exchange address", type: "string", demandOption: true })
            .option("gas", { describe: "Gas price in WEI", type: "string", demandOption: false })
            .argv;

        console.log(`Deploying Permit callee contract on ${options.network} 🍕`)

        const tx = await PermitCallee.new({gasPrice: options.gas});

        console.log("Permit callee deployed! 🎉");
        console.log(`Transaction hash: ${tx.transactionHash}`);
        console.log(`Deployed contract address: ${tx.address}`);

        callback();
    }
    catch(err) {
        callback(err);
    }
} 
