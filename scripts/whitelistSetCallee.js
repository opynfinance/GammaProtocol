const yargs = require('yargs')

const Whitelist = artifacts.require('Whitelist.sol')

module.exports = async function(callback) {
  try {
    const options = yargs
      .usage('Usage: --network <network> --whitelist <whitelist> --callee <callee> --gasPrice <gasPrice>')
      .option('network', {describe: 'Network name', type: 'string', demandOption: true})
      .option('whitelist', {describe: 'Whitelist contract address', type: 'string', demandOption: true})
      .option('callee', {describe: 'Callee contract address', type: 'string', demandOption: true})
      .option('gasPrice', {describe: 'Gas price in WEI', type: 'string', demandOption: false}).argv

    console.log(`Executing transaction on ${options.network} 🍕`)

    const whitelist = await Whitelist.at(options.whitelist)

    const tx = await whitelist.whitelistCallee(options.callee, {gasPrice: options.gasPrice})

    console.log('Done! 🎉')
    console.log(
      `Callee contract whitelisting set to: ${await whitelist.isWhitelistedCallee(options.callee)} at TX hash ${tx.tx}`,
    )

    callback()
  } catch (err) {
    callback(err)
  }
}
