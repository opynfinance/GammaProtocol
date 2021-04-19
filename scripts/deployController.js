const yargs = require('yargs')

const MarginVault = artifacts.require('MarginVault.sol')
const Controller = artifacts.require('Controller.sol')

module.exports = async function(callback) {
  try {
    const options = yargs
      .usage('Usage: --network <network> --gasPrice <gasPrice> --gas <gasLimit>')
      .option('network', {describe: 'Network name', type: 'string', demandOption: true})
      .option('gasPrice', {describe: 'Gas price in WEI', type: 'string', demandOption: false})
      .option('gas', {describe: 'Gas Limit in WEI', type: 'string', demandOption: false}).argv

    console.log(`Deploying Controller contract on ${options.network} 🍕`)

    const tx1 = await MarginVault.new({gasPrice: options.gasPrice, gas: options.gas})
    const marginVault = await MarginVault.at(tx1.address)
    console.log(`Linking: ${tx1.address}`)
    await Controller.link(marginVault)
    console.log(`linking done`)

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
