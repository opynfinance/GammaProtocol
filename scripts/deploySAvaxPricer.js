const yargs = require('yargs')

const SAvaxPricer = artifacts.require('SAvaxPricer.sol')

module.exports = async function (callback) {
  try {
    const options = yargs
      .usage(
        'Usage: --network <network> --sAvax <sAvax> --underlying <underlying> --oracle <oracle> --gasPrice <gasPrice> --gasLimit <gasLimit>',
      )
      .option('network', { describe: 'Network name', type: 'string', demandOption: true })
      .option('sAvax', { describe: 'sAvax address', type: 'string', demandOption: true })
      .option('underlying', { describe: 'Underlying address', type: 'string', demandOption: true })
      .option('oracle', { describe: 'Oracle module address', type: 'string', demandOption: true })
      .option('gasPrice', { describe: 'Gas price in WEI', type: 'string', demandOption: false })
      .option('gasLimit', { describe: 'Gas Limit in WEI', type: 'string', demandOption: false }).argv

    console.log(`Deploying sAvax pricer contract to ${options.network} 🍕`)

    const tx = await SAvaxPricer.new(options.sAvax, options.underlying, options.oracle, {
      gasPrice: options.gasPrice,
      gas: options.gasLimit,
    })

    console.log('sAvax pricer deployed! 🎉')
    console.log(`Transaction hash: ${tx.transactionHash}`)
    console.log(`Deployed contract address: ${tx.address}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
