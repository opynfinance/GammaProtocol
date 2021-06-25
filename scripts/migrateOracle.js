const BigNumber = require('bignumber.js')
const yargs = require('yargs')
const Oracle = artifacts.require('Oracle.sol')
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
 * @returns {Promise<any[]>}
 */
async function getOTokens(network, internal) {
  const currentTimeStamp = Math.floor(Date.now() / 1000)

  const query = `
  {
    otokens (
      first: 1000,
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
    const prefixt = internal ? 'gamma-internal' : 'gamma'
    const url = `https://api.thegraph.com/subgraphs/name/opynfinance/${prefixt}-${network}`
    console.log(`Requesting subgraph`, url)
    const response = await postQuery(url, query)
    return response.data.otokens
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * Get all oTokens
 */
async function getAllSettlementPrices(asset, network, internal) {
  const query = `
  {
    expiryPrices (where:{
      asset: "${asset}"
    }, first:1000) {
      expiry
      price
    }
  }
  `
  try {
    const prefixt = internal ? 'gamma-internal' : 'gamma'
    const url = `https://api.thegraph.com/subgraphs/name/opynfinance/${prefixt}-${network}`
    const response = await postQuery(url, query)
    return response.data.expiryPrices
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 *
 */
async function getCoinGeckData(coinId, expiry) {
  const date = new Date(expiry * 1000)
  const yyyymmdd = date.toISOString().split('T')[0]
  const [year, month, day] = yyyymmdd.split('-')
  const dateString = `${day}-${month}-${year}`
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${dateString}&localization=false`
  const data = await (await fetch(url)).json()
  return Math.floor(data.market_data.current_price.usd * 1e8)
}

/**
 * @example
 * truffle exec scripts/migrateOracle.js
 *  --network kovan
 *  --internal true
 *  --newOracle 0x8b71104e11931775957932728717b0F81461bc0d
 *  --asset 0x50570256f0da172a1908207aAf0c80d4b279f303
 *  --coinId bitcoin
 */
module.exports = async function(callback) {
  try {
    const options = yargs
      .usage(
        'Usage: --network <network> --internal <internal> --newOracle <newOracle> --asset <asset> --gasPrice <gasPrice>',
      )
      .option('network', {describe: '0x exchange address', type: 'string', demandOption: true})
      .option('newOracle', {describe: 'New oracle module address', type: 'string', demandOption: true})
      .option('asset', {describe: 'Asset address to migrate', type: 'string', demandOption: true})
      .option('internal', {describe: 'Internal network or not', type: 'string', demandOption: true})
      .option('coinId', {
        describe: 'coingecko id used to search for price if it was not reported in our oracle',
        type: 'string',
      })
      .option('gasPrice', {describe: 'Gas price in WEI', type: 'string', demandOption: false}).argv

    console.log('Init contracts 🍕')

    const asset = options.asset.toLowerCase()

    // const factory = await OtokenFactory.at(options.factory)
    // const oldOracle = await Oracle.at(options.oldOracle)
    const newOracle = await Oracle.at(options.newOracle)

    console.log(`Getting list of create Otokens with asset ${asset} 🍕`)

    // const expiriesToMigrate = []
    // const pricesToMigrate = []

    const otokens = await getOTokens(options.network, options.internal === 'true')

    console.log(`# of otokens from subgraph: ${otokens.length}`)

    const prices = await getAllSettlementPrices(asset, options.network, options.internal)

    const oTokensWithAsset = otokens.filter(
      otoken =>
        otoken.underlyingAsset.id === asset || otoken.collateralAsset.id === asset || otoken.strikeAsset.id === asset,
    )

    const filteredExpiries = oTokensWithAsset.reduce((prev, curr) => {
      if (!prev.includes(curr.expiryTimestamp)) {
        return [...prev, curr.expiryTimestamp]
      } else {
        return [...prev]
      }
    }, [])

    const knownRecordSubgraph = prices.filter(priceObj => filteredExpiries.includes(priceObj.expiry))
    const missingExpires = filteredExpiries.filter(
      expiry => !knownRecordSubgraph.map(obj => obj.expiry).includes(expiry),
    )

    const missingPrices = []
    for (const expiry of missingExpires) {
      const price = await getCoinGeckData(options.coinId, expiry)
      missingPrices.push(price.toString())
      console.log(`Got price for expiry ${expiry} from CoinGeck: ${price}`)
    }

    const knownPrices = knownRecordSubgraph.map(obj => obj.price)
    const knownExpires = knownRecordSubgraph.map(obj => obj.expiry)

    const finalPrices = [...knownPrices, ...missingPrices]
    const finalExpires = [...knownExpires, ...missingExpires]

    console.log(`Final expires`, finalExpires)
    console.log(`Final prices`, finalPrices)

    // console.log(`Found ${expiriesToMigrate.length} expiry price 🎉`)

    if (finalPrices.length === 0) throw 'Nothing to Migrate'

    console.log(`Migrating prices to new Oracle at ${newOracle.address} 🎉`)

    const tx = await newOracle.migrateOracle(options.asset, finalExpires, finalPrices)

    console.log(`Oracle prices migration done for asset ${options.asset}! 🎉`)
    console.log(`Transaction hash: ${tx.tx}`)

    callback()
  } catch (err) {
    callback(err)
  }
}
