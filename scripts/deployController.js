const yargs = require('yargs')

const MarginVault = artifacts.require('MarginVault.sol')
const Controller = artifacts.require('Controller.sol')

module.exports = async function(callback) {
  try {
    const options = yargs
      .usage('Usage: --network <network> --gasPrice <gasPrice> --gas <gasLimit> --marginVault')
      .option('network', {describe: 'Network name', type: 'string', demandOption: true})
      .option('marginVault', {description: 'Lib MarginVault address', type: 'string', demandOption: true})
      .option('gasPrice', {describe: 'Gas price in WEI', type: 'string', demandOption: false})
      .option('gas', {describe: 'Gas Limit in WEI', type: 'string', demandOption: false}).argv

    console.log(`Deploying Controller contract on ${options.network} 🍕`)

    const marginVault = await MarginVault.at(options.marginVault)
    await Controller.link(marginVault)
    console.log(`Linking MarginVault done`)

    // deploy controller

    const tx = await Controller.new({gasPrice: options.gasPrice, gas: options.gas})

    console.log('Controller implementation deployed! 🎉')
    console.log(`Transaction hash: ${tx.transactionHash}`)
    console.log(`Deployed contract address: ${tx.address}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
