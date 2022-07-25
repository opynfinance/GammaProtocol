const yargs = require('yargs')

const WstethPricer = artifacts.require('WstethPricer.sol')

module.exports = async function (callback) {
  try {
    const options = yargs
      .usage(
        'Usage: --network <network> --wstETH <wstETH> --underlying <underlying> --oracle <oracle> --gasPrice <gasPrice> --gasLimit <gasLimit>',
      )
      .option('network', { describe: 'Network name', type: 'string', demandOption: true })
      .option('wstETH', { describe: 'wstETH address', type: 'string', demandOption: true })
      .option('underlying', { describe: 'Underlying address', type: 'string', demandOption: true })
      .option('oracle', { describe: 'Oracle module address', type: 'string', demandOption: true })
      .option('gasPrice', { describe: 'Gas price in WEI', type: 'string', demandOption: false })
      .option('gasLimit', { describe: 'Gas Limit in WEI', type: 'string', demandOption: false }).argv

    console.log(`Deploying wstETH pricer contract to ${options.network} 🍕`)

    const tx = await WstethPricer.new(options.wstETH, options.underlying, options.oracle, {
      gasPrice: options.gasPrice,
      gas: options.gasLimit,
    })

    console.log('wstETH pricer deployed! 🎉')
    console.log(`Transaction hash: ${tx.transactionHash}`)
    console.log(`Deployed contract address: ${tx.address}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
