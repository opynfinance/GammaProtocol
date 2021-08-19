const yargs = require('yargs')

const StakedaoEcrvPricer = artifacts.require('StakedaoEcrvPricer.sol')

module.exports = async function(callback) {
  try {
    const options = yargs
      .usage(
        'Usage: --network <network> --lpToken <lpToken> --underlying <underlying> --oracle <oracle> --curve <curve> --gasPrice <gasPrice> --gasLimit <gasLimit>',
      )
      .option('network', {describe: 'Network name', type: 'string', demandOption: true})
      .option('lpToken', {describe: 'lpToken address', type: 'string', demandOption: true})
      .option('underlying', {describe: 'Underlying address', type: 'string', demandOption: true})
      .option('oracle', {describe: 'Oracle module address', type: 'string', demandOption: true})
      .option('curve', {describe: 'curve pool address', type: 'string', demandOption: true})
      .option('gasPrice', {describe: 'Gas price in WEI', type: 'string', demandOption: false})
      .option('gasLimit', {describe: 'Gas Limit in WEI', type: 'string', demandOption: false}).argv

    console.log(`Deploying Stakedao eCRV pricer contract to ${options.network} 🍕`)

    const tx = await StakedaoEcrvPricer.new(options.lpToken, options.underlying, options.oracle, options.curve, {
      gasPrice: options.gasPrice,
      gas: options.gasLimit,
    })

    console.log('Stakedao eCRV pricer deployed! 🎉')
    console.log(`Transaction hash: ${tx.transactionHash}`)
    console.log(`Deployed contract address: ${tx.address}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
