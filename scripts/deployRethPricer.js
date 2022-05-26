const yargs = require('yargs')

const RethPricer = artifacts.require('RethPricer.sol')

module.exports = async function (callback) {
  try {
    const options = yargs
      .usage(
        'Usage: --network <network> --rETH <rETH> --underlying <underlying> --oracle <oracle> --gasPrice <gasPrice> --gasLimit <gasLimit>',
      )
      .option('network', { describe: 'Network name', type: 'string', demandOption: true })
      .option('rETH', { describe: 'rETH address', type: 'string', demandOption: true })
      .option('underlying', { describe: 'Underlying address', type: 'string', demandOption: true })
      .option('oracle', { describe: 'Oracle module address', type: 'string', demandOption: true })
      .option('gasPrice', { describe: 'Gas price in WEI', type: 'string', demandOption: false })
      .option('gasLimit', { describe: 'Gas Limit in WEI', type: 'string', demandOption: false }).argv

    console.log(`Deploying rETH pricer contract to ${options.network} 🍕`)

    const tx = await RethPricer.new(options.rETH, options.underlying, options.oracle, {
      gasPrice: options.gasPrice,
      gas: options.gasLimit,
    })

    console.log('rETH pricer deployed! 🎉')
    console.log(`Transaction hash: ${tx.transactionHash}`)
    console.log(`Deployed contract address: ${tx.address}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
