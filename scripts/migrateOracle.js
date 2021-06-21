const BigNumber = require('bignumber.js')

const yargs = require('yargs')

const OtokenFactory = artifacts.require('OtokenFactory.sol')
const Oracle = artifacts.require('Oracle.sol')
const Otoken = artifacts.require('Otoken.sol')

module.exports = async function(callback) {
  try {
    const options = yargs
      .usage('Usage: --network <network> --factory <otokenFactory> --oldOracle <oldOracle> --newOracle <newOracle> --asset <asset> --gasPrice <gasPrice>')
      .option('network', {describe: '0x exchange address', type: 'string', demandOption: true})
      .option('factory', {describe: 'Otoken factory address', type: 'string', demandOption: true})
      .option('oldOracle', {describe: 'Old oracle module address', type: 'string', demandOption: true})
      .option('newOracle', {describe: 'New oracle module address', type: 'string', demandOption: true})
      .option('asset', {describe: 'Asset address to migrate', type: 'string', demandOption: true})
      .option('gasPrice', {describe: 'Gas price in WEI', type: 'string', demandOption: false}).argv
  
    console.log('Init contracts 🍕')

    const factory = await OtokenFactory.at(options.factory)
    const oldOracle = await Oracle.at(options.oldOracle)
    const newOracle = await Oracle.at(options.newOracle)

    console.log(`Getting list of create Otokens with asset ${options.asset} 🍕`)

    const currentTimeStamp = Math.floor(Date.now() / 1000);
    const otokenLength = new BigNumber(await factory.getOtokensLength())
    
    let expiriesToMigrate = []
    let pricesToMigrate = []

    for(let i = 0; i < otokenLength.toFixed(); i++) {
      const otokenAddress = await factory.otokens(i)
      const otokenDetails = await (await Otoken.at(otokenAddress)).getOtokenDetails()
      const expiry = new BigNumber(otokenDetails[4])

      if((otokenDetails[0] == options.asset || otokenDetails[1] == options.asset || otokenDetails[2] == options.asset) && (expiry.toNumber() < currentTimeStamp) && (!expiriesToMigrate.includes(expiry.toString()))) {
        const priceToMigrate = new BigNumber((await oldOracle.getExpiryPrice(options.asset, expiry.toString()))[0])

        expiriesToMigrate.push(expiry.toString())
        pricesToMigrate.push(priceToMigrate.toString())
      }
    }

    console.log(`Found ${expiriesToMigrate.length} expiry price 🎉`)
    console.log(`Migrating prices to new Oracle at ${newOracle.address} 🎉`)

    const tx = await newOracle.migrateOracle(options.asset, expiriesToMigrate, pricesToMigrate)

    console.log(`Oracle prices migration done for asset ${options.asset}! 🎉`)
    console.log(`Transaction hash: ${tx.transactionHash}`)

    callback()
  } catch (err) {
    callback(err)
  }
}