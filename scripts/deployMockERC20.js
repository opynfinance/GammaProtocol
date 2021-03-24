const yargs = require('yargs')

const ERC20 = artifacts.require('MockERC20.sol')
const PermitERC20 = artifacts.require('MockPermitERC20.sol')

module.exports = async function(callback) {
  try {
    const options = yargs
      .usage('Usage: --name <name> --symbol <symbol> --decimals <decimals> --permit <permit> --gasPrice <gasPrice>')
      .option('name', {describe: 'Token Name', type: 'string', demandOption: true})
      .option('symbol', {describe: 'Token Symbol', type: 'string', demandOption: true})
      .option('decimals', {describe: 'Token Decimals', type: 'string', demandOption: true})
      .option('permit', {describe: 'Support Permit or not', type: 'boolean', decimals: true})
      .option('gasPrice', {describe: 'Gas price in WEI', type: 'string', demandOption: false}).argv

    console.log(`Deploying MockERC20: ${options.symbol} contract on ${options.network} 🍕`)

    const tx = options.permit
      ? await PermitERC20.new(options.name, options.symbol, options.decimals, {gasPrice: options.gasPrice})
      : await ERC20.new(options.name, options.symbol, options.decimals, {gasPrice: options.gasPrice})

    console.log('MockERC20 deployed! 🎉')
    console.log(`Transaction hash: ${tx.transactionHash}`)
    console.log(`Deployed contract address: ${tx.address}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
