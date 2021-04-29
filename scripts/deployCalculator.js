const yargs = require('yargs')

const MarginCalculator = artifacts.require('MarginCalculator.sol')

module.exports = async function(callback) {
  try {
    const options = yargs
      .usage('Usage: --network <network> --gasPrice <gasPrice> --gas <gasLimit> --oracle <oracle>')
      .option('network', {describe: 'Network name', type: 'string', demandOption: true})
      .option('oracle', {description: 'Oracle address', type: 'string', demandOption: true})
      .option('gasPrice', {describe: 'Gas price in WEI', type: 'string', demandOption: false})
      .option('gas', {describe: 'Gas Limit in WEI', type: 'string', demandOption: false}).argv

    console.log(`Deploying MarginCalculator contract on ${options.network} 🍕`)

    const tx = await MarginCalculator.new(options.oracle, {gasPrice: options.gasPrice, gas: options.gas})

    console.log('MarginCalculator deployed! 🎉')
    console.log(`Transaction hash: ${tx.transactionHash}`)
    console.log(`Deployed contract address: ${tx.address}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
