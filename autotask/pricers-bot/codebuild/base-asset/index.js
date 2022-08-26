const { ethers } = require("ethers");
const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');


// Cli Gamma Sync Information = null performed sync using autoclient on Thu Mar 31 2022 14:30:53 GMT+0100 (West Africa Standard Time);


var AddressBookAbiString = '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":true,"internalType":"address","name":"add","type":"address"}],"name":"AddressAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":true,"internalType":"address","name":"proxy","type":"address"}],"name":"ProxyCreated","type":"event"},{"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"}],"name":"getAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getController","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getLiquidationManager","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMarginCalculator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMarginPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOracle","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOtokenFactory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOtokenImpl","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getWhitelist","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"},{"internalType":"address","name":"_address","type":"address"}],"name":"setAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_controller","type":"address"}],"name":"setController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_liquidationManager","type":"address"}],"name":"setLiquidationManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_marginCalculator","type":"address"}],"name":"setMarginCalculator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_marginPool","type":"address"}],"name":"setMarginPool","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_oracle","type":"address"}],"name":"setOracle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_otokenFactory","type":"address"}],"name":"setOtokenFactory","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_otokenImpl","type":"address"}],"name":"setOtokenImpl","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_whitelist","type":"address"}],"name":"setWhitelist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_id","type":"bytes32"},{"internalType":"address","name":"_newAddress","type":"address"}],"name":"updateImpl","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
var OracleAbiString = '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newDisputer","type":"address"}],"name":"DisputerUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":true,"internalType":"uint256","name":"expiryTimestamp","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"disputedPrice","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newPrice","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"disputeTimestamp","type":"uint256"}],"name":"ExpiryPriceDisputed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":true,"internalType":"uint256","name":"expiryTimestamp","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"price","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"onchainTimestamp","type":"uint256"}],"name":"ExpiryPriceUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"pricer","type":"address"},{"indexed":false,"internalType":"uint256","name":"disputePeriod","type":"uint256"}],"name":"PricerDisputePeriodUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"pricer","type":"address"},{"indexed":false,"internalType":"uint256","name":"lockingPeriod","type":"uint256"}],"name":"PricerLockingPeriodUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":true,"internalType":"address","name":"pricer","type":"address"}],"name":"PricerUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":false,"internalType":"uint256","name":"price","type":"uint256"}],"name":"StablePriceUpdated","type":"event"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"},{"internalType":"uint256","name":"_price","type":"uint256"}],"name":"disputeExpiryPrice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"endMigration","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint80","name":"_roundId","type":"uint80"}],"name":"getChainlinkRoundData","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getDisputer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"}],"name":"getExpiryPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"}],"name":"getPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"}],"name":"getPricer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_pricer","type":"address"}],"name":"getPricerDisputePeriod","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_pricer","type":"address"}],"name":"getPricerLockingPeriod","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"}],"name":"isDisputePeriodOver","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"}],"name":"isLockingPeriodOver","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256[]","name":"_expiries","type":"uint256[]"},{"internalType":"uint256[]","name":"_prices","type":"uint256[]"}],"name":"migrateOracle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"address","name":"_pricer","type":"address"}],"name":"setAssetPricer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_pricer","type":"address"},{"internalType":"uint256","name":"_disputePeriod","type":"uint256"}],"name":"setDisputePeriod","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_disputer","type":"address"}],"name":"setDisputer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"},{"internalType":"uint256","name":"_price","type":"uint256"}],"name":"setExpiryPrice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_pricer","type":"address"},{"internalType":"uint256","name":"_lockingPeriod","type":"uint256"}],"name":"setLockingPeriod","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_price","type":"uint256"}],"name":"setStablePrice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
var ChainlinkPricerAbiString = '[{"inputs":[{"internalType":"address","name":"_bot","type":"address"},{"internalType":"address","name":"_asset","type":"address"},{"internalType":"address","name":"_aggregator","type":"address"},{"internalType":"address","name":"_oracle","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"aggregator","outputs":[{"internalType":"contract AggregatorInterface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"aggregatorDecimals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"asset","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"bot","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint80","name":"_roundId","type":"uint80"}],"name":"getHistoricalPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"oracle","outputs":[{"internalType":"contract OracleInterface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"},{"internalType":"uint80","name":"_roundId","type":"uint80"}],"name":"setExpiryPriceInOracle","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
var AggregatorInterfaceAbiString = '[{"inputs":[{"internalType":"address","name":"_aggregator","type":"address"},{"internalType":"address","name":"_accessController","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"int256","name":"current","type":"int256"},{"indexed":true,"internalType":"uint256","name":"roundId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"updatedAt","type":"uint256"}],"name":"AnswerUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"roundId","type":"uint256"},{"indexed":true,"internalType":"address","name":"startedBy","type":"address"},{"indexed":false,"internalType":"uint256","name":"startedAt","type":"uint256"}],"name":"NewRound","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"accessController","outputs":[{"internalType":"contract AccessControllerInterface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"aggregator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_aggregator","type":"address"}],"name":"confirmAggregator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"description","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_roundId","type":"uint256"}],"name":"getAnswer","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint80","name":"_roundId","type":"uint80"}],"name":"getRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_roundId","type":"uint256"}],"name":"getTimestamp","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestAnswer","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRound","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestTimestamp","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint16","name":"","type":"uint16"}],"name":"phaseAggregators","outputs":[{"internalType":"contract AggregatorV2V3Interface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"phaseId","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_aggregator","type":"address"}],"name":"proposeAggregator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"proposedAggregator","outputs":[{"internalType":"contract AggregatorV2V3Interface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint80","name":"_roundId","type":"uint80"}],"name":"proposedGetRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"proposedLatestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_accessController","type":"address"}],"name":"setController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_to","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"version","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]';

var pricerAddressString = '0x17300f7e8F061B84EBd795D7A224e2875734b11B';
var pricerAssetString = '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB';
var aggregatorAddressString = '0x976B3D034E162d8bD72D6b9C989d545b839003b0';


const AddressBookAbi = JSON.parse(AddressBookAbiString);
const OracleAbi = JSON.parse(OracleAbiString);
const ChainlinkPricerAbi = JSON.parse(ChainlinkPricerAbiString);
const AggregatorInterfaceAbi = JSON.parse(AggregatorInterfaceAbiString);

// Entrypoint for the Autotask
exports.handler = async function(credentials) {
    // config
    const relayerAddress = '0x0ca7562e993341db1e435a27c9f56931306290a7';                    // Relayer address
    const addressbookAddress = '0xBCa124824326CF8aBc5E2E569FFf3A6f17110510';                // AddressBook module
    const pricerAddress = pricerAddressString.split(',');                     // [wbtc, weth, aave, uni, sushi, link, dpi]
    const pricerAsset = pricerAssetString.split(',');                      // [wbtc, weth, aave, uni, sushi, link, dpi ]
    const chainlinkAggregatorAddress = aggregatorAddressString.split(',');         // [wbtc, weth, aave, uni, sushi, link, dpi]
  
    // Initialize default provider and defender relayer signer
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, { 
        speed: 'fast', 
        from: relayerAddress,
    });
  
    // addressbook instance
    const addressbook = new ethers.Contract(addressbookAddress, AddressBookAbi, signer);
    // oracle address
    const oracleAddress = await addressbook.getOracle();
    // oracle instance
    const oracle = new ethers.Contract(oracleAddress, OracleAbi, signer);
    // Otoken expiry hour in UTC
    const expiryHour = 8;
    
    console.log('Oracle: ', oracle.address);
  
    // set expiry timestamp
    let expiryTimestamp = new Date();
    expiryTimestamp.setHours(expiryHour);
    expiryTimestamp.setMinutes(0);
    expiryTimestamp.setSeconds(0);
    expiryTimestamp = Math.floor(expiryTimestamp.getTime() / 1000);
  
    // current timestamp in UTC seconds
    let currentTimestamp = new Date();
    const hour = currentTimestamp.getHours();
    const weekday = currentTimestamp.toLocaleString("default", { weekday: "long" });
    currentTimestamp = Math.floor(currentTimestamp.getTime() / 1000);
  
    console.log('Expiry timestamp: ', expiryTimestamp.toString())
    console.log('Current timestamp: ', currentTimestamp);
    console.log('Current hour: ', hour);
  	console.log('Current dat: ', weekday);
  
    if(hour >= expiryHour) {
      for (let i = 0; i < pricerAddress.length; i++) {
        if (weekday == 'Friday') {
            // pricer instance
            const pricer = new ethers.Contract(pricerAddress[i], ChainlinkPricerAbi, signer);
            // chainlink price feed instance
            const chainlinkAggregator = new ethers.Contract(chainlinkAggregatorAddress[i], AggregatorInterfaceAbi, signer);
    
            console.log('Pricer: ', pricer.address);
            console.log('Pricer asset: ', pricerAsset[i]);
            console.log('Chainlink aggregator: ', chainlinkAggregator.address);
        
            let expiryPrice = await oracle.getExpiryPrice(pricerAsset[i], expiryTimestamp);
            let isLockingPeriodOver = await oracle.isLockingPeriodOver(pricerAsset[i], expiryTimestamp);
    
            console.log('Oracle expiry price: ', expiryPrice[0].toString());
            console.log('Is locking period over: ', isLockingPeriodOver);
    
            if ((expiryPrice[0].toString() == '0') && isLockingPeriodOver) {
            // round id for expiry timestamp
            let priceRoundId = await chainlinkAggregator.latestRound();
            let priceRoundTimestamp = await chainlinkAggregator.getTimestamp(priceRoundId);
            // round id before price round id
            let previousRoundId;
            let previousRoundTimestamp;
    
            // check if otoken price is not on-chain, and latest chainlink round timestamp is greater than otoken expiry timestamp and locking period over
            if (priceRoundTimestamp.toString() >= expiryTimestamp) {
                // loop and decrease round id until previousRoundTimestamp < expiryTimestamp && priceRoundTimestamp >= expiryTimestamp
                // if previous round timestamp != 0 && less than expiry timestamp then exit => price round id found
                // else store previous round id in price round id (as we are searching for the first round id that it timestamp >= expiry timestamp)
                for (let j = priceRoundId.sub(1); j > 0; j = j.sub(1)) {
                    previousRoundId = j;
                    previousRoundTimestamp = await chainlinkAggregator.getTimestamp(j);
    
                    if (previousRoundTimestamp.toString() != '0') {    
                    if (previousRoundTimestamp.toString() < expiryTimestamp.toString()) {
                        break;
                    }
                    else {
                        priceRoundId = previousRoundId;
                        priceRoundTimestamp = previousRoundTimestamp;
                    }
                    } 
                }
    
                console.log('Found round id: ', priceRoundId.toString());
                console.log('Found round timestamp: ', priceRoundTimestamp.toString());
    
                let tx = await pricer.setExpiryPriceInOracle(expiryTimestamp, priceRoundId, {gasLimit: '1000000'});
    
                console.log('Tx hash: ', tx.hash);
            }
            else {
                console.log(`Chainlink latest round timestamp ${priceRoundTimestamp} is not grater than or equal the expiry timestamp `)
            }
          }
        }
      }
    }
  }


  
  // To run locally (this code will not be executed in Autotasks)
  if (require.main === module) {
      const { API_KEY: apiKey, API_SECRET: apiSecret } = process.env;
      exports.handler({ apiKey, apiSecret })
          .then(() => process.exit(0))
          .catch(error => { console.error(error); process.exit(1); });
  }