const yargs = require('yargs')

const Otoken = artifacts.require('Otoken.sol')

module.exports = async function(callback) {
  try {
    const options = yargs
      .usage('Usage: --network <network> --gas <gasPrice>')
      .option('network', {describe: 'Network name', type: 'string', demandOption: true})
      .option('gas', {describe: 'Gas price in WEI', type: 'string', demandOption: false}).argv

    console.log(`Deploying Otoken contract on ${options.network} 🍕`)

    const tx = await Otoken.new({gasPrice: options.gas})

    console.log('Otoken implementation deployed! 🎉')
    console.log(`Transaction hash: ${tx.transactionHash}`)
    console.log(`Deployed contract address: ${tx.address}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
