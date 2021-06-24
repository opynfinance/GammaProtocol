const BigNumber = require('bignumber.js')

const yargs = require('yargs')

const OtokenFactory = artifacts.require('OtokenFactory.sol')
const Oracle = artifacts.require('Oracle.sol')
const Otoken = artifacts.require('Otoken.sol')

const fetch = require('node-fetch')

const postQuery = async (endpoint, query) => {
  const options = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query}),
  }
  const url = endpoint
  const response = await fetch(url, options)
  const data = await response.json()
  if (data.errors) {
    throw new Error(data.errors[0].message)
  } else {
    return data
  }
}

/**
 * Get all oTokens
 */
async function getOTokens() {
  const currentTimeStamp = Math.floor(Date.now() / 1000)

  const query = `
  {
    otokens (
      first: 500,
      where: {
        expiryTimestamp_lt: ${currentTimeStamp},
      }
    )  {
      strikeAsset {
        id
      }
      underlyingAsset {
        id
      }
      collateralAsset {
        id
      }
      isPut
      expiryTimestamp
    }
  }`
  try {
    const response = await postQuery('https://api.thegraph.com/subgraphs/name/opynfinance/gamma-kovan', query)
    return response.data.otokens
  } catch (error) {
    console.error(error)
    return []
  }
}

module.exports = async function(callback) {
  try {
    const options = yargs
      .usage(
        'Usage: --network <network> --factory <otokenFactory> --oldOracle <oldOracle> --newOracle <newOracle> --asset <asset> --gasPrice <gasPrice>',
      )
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

    const currentTimeStamp = Math.floor(Date.now() / 1000)
    const otokenLength = new BigNumber(await factory.getOtokensLength())

    const expiriesToMigrate = []
    const pricesToMigrate = []

    console.log(`total tokens: ${otokenLength}`)

    const otokens = await getOTokens()

    console.log(`fromSubgraph: ${otokens.length}`)

    for (let i = 0; i < otokens.length; i++) {
      // const otokenAddress = await factory.otokens(i)

      const otoken = otokens[i]

      // const otoken = await Otoken.at(otokenAddress)

      const strike = otoken.strikeAsset.id
      const collateral = otoken.collateralAsset.id
      const underlying = otoken.underlyingAsset.id
      const expiry = otoken.expiryTimestamp
      if (
        (strike.toLowerCase() == options.asset.toLowerCase() ||
          collateral.toLowerCase() == options.asset.toLowerCase() ||
          underlying.toLowerCase() == options.asset.toLowerCase()) &&
        !expiriesToMigrate.includes(expiry.toString())
      ) {
        const priceToMigrate = new BigNumber((await oldOracle.getExpiryPrice(options.asset, expiry.toString()))[0])

        expiriesToMigrate.push(expiry.toString())
        pricesToMigrate.push(priceToMigrate.toString())
        console.log('pushed', expiriesToMigrate.length)
      } else {
      }
    }

    console.log(`Found ${expiriesToMigrate.length} expiry price 🎉`)
    console.log(`Migrating prices to new Oracle at ${newOracle.address} 🎉`)

    const tx = await newOracle.migrateOracle(options.asset, expiriesToMigrate, pricesToMigrate)

    console.log(`Oracle prices migration done for asset ${options.asset}! 🎉`)
    console.log(`Transaction hash: ${tx.tx}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
