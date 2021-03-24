const yargs = require('yargs')

const ChainlinkPricer = artifacts.require('ChainlinkPricer.sol')

module.exports = async function(callback) {
  try {
    const options = yargs
      .usage(
        'Usage: --network <network> --bot <bot> --asset <asset> --aggregator <aggregator> --oracle <oracle> --gasPrice <gasPrice> --gasLimit <gasLimit>',
      )
      .option('network', {describe: 'Network name', type: 'string', demandOption: true})
      .option('bot', {describe: 'Bot address', type: 'string', demandOption: true})
      .option('asset', {describe: 'Asset address', type: 'string', demandOption: true})
      .option('aggregator', {describe: 'Chainlink aggregator address', type: 'string', demandOption: true})
      .option('oracle', {describe: 'Oracle module address', type: 'string', demandOption: true})
      .option('gasPrice', {describe: 'Gas price in WEI', type: 'string', demandOption: false})
      .option('gasLimit', {describe: 'Gas Limit in WEI', type: 'string', demandOption: false}).argv

    console.log(`Deploying chainlink pricer contract on ${options.network} 🍕`)

    const tx = await ChainlinkPricer.new(options.bot, options.asset, options.aggregator, options.oracle, {
      gasPrice: options.gasPrice,
      gas: options.gasLimit,
    })

    console.log('Chainlink pricer deployed! 🎉')
    console.log(`Transaction hash: ${tx.transactionHash}`)
    console.log(`Deployed contract address: ${tx.address}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
