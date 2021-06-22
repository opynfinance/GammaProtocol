const yargs = require('yargs')

const MockPricer = artifacts.require('MockPricer.sol')

module.exports = async function(callback) {
  try {
    const options = yargs
      .usage(
        'Usage: --network <network> --asset <asset> --oracle <oracle> --gasPrice <gasPrice>',
      )
      .option('network', {describe: 'Network name', type: 'string', demandOption: true})
      .option('asset', {describe: 'Asset address', type: 'string', demandOption: true})
      .option('oracle', {describe: 'Oracle module address', type: 'string', demandOption: true})
      .option('gasPrice', {describe: 'Gas price in WEI', type: 'string', demandOption: false}).argv

    console.log(`Deploying chainlink pricer contract on ${options.network} 🍕`)

    const tx = await MockPricer.new(options.asset, options.oracle, {
      gasPrice: options.gasPrice
    })

    console.log('MockPricer deployed! 🎉')
    console.log(`Transaction hash: ${tx.transactionHash}`)
    console.log(`Deployed contract address: ${tx.address}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
