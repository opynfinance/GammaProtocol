const { ethers } = require("ethers");
const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');


// Cli Gamma Sync Information = null performed sync using autoclient on Sun Mar 27 2022 23:04:30 GMT+0100 (West Africa Standard Time);


var AddressBookAbiString = '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":false,"internalType":"address","name":"add","type":"address"}],"name":"AddressAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":false,"internalType":"address","name":"proxy","type":"address"}],"name":"ProxyCreated","type":"event"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getOtokenImpl","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOtokenFactory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getWhitelist","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getController","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMarginPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMarginCalculator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getLiquidationManager","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOracle","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_otokenImpl","type":"address"}],"name":"setOtokenImpl","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_otokenFactory","type":"address"}],"name":"setOtokenFactory","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_whitelist","type":"address"}],"name":"setWhitelist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_controller","type":"address"}],"name":"setController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_marginPool","type":"address"}],"name":"setMarginPool","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_marginCalculator","type":"address"}],"name":"setMarginCalculator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_liquidationManager","type":"address"}],"name":"setLiquidationManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_oracle","type":"address"}],"name":"setOracle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"}],"name":"getAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"},{"internalType":"address","name":"_address","type":"address"}],"name":"setAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_id","type":"bytes32"},{"internalType":"address","name":"_newAddress","type":"address"}],"name":"updateImpl","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
var OracleAbiString = '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newDisputer","type":"address"}],"name":"DisputerUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":true,"internalType":"uint256","name":"expiryTimestamp","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"disputedPrice","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newPrice","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"disputeTimestamp","type":"uint256"}],"name":"ExpiryPriceDisputed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":true,"internalType":"uint256","name":"expirtyTimestamp","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"price","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"onchainTimestamp","type":"uint256"}],"name":"ExpiryPriceUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"pricer","type":"address"},{"indexed":false,"internalType":"uint256","name":"disputePeriod","type":"uint256"}],"name":"PricerDisputePeriodUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"pricer","type":"address"},{"indexed":false,"internalType":"uint256","name":"lockingPeriod","type":"uint256"}],"name":"PricerLockingPeriodUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"asset","type":"address"},{"indexed":false,"internalType":"address","name":"pricer","type":"address"}],"name":"PricerUpdated","type":"event"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"}],"name":"getPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"}],"name":"getExpiryPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"}],"name":"getPricer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getDisputer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_pricer","type":"address"}],"name":"getPricerLockingPeriod","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_pricer","type":"address"}],"name":"getPricerDisputePeriod","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"}],"name":"isLockingPeriodOver","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"}],"name":"isDisputePeriodOver","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"address","name":"_pricer","type":"address"}],"name":"setAssetPricer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_pricer","type":"address"},{"internalType":"uint256","name":"_lockingPeriod","type":"uint256"}],"name":"setLockingPeriod","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_pricer","type":"address"},{"internalType":"uint256","name":"_disputePeriod","type":"uint256"}],"name":"setDisputePeriod","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_disputer","type":"address"}],"name":"setDisputer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"},{"internalType":"uint256","name":"_price","type":"uint256"}],"name":"disputeExpiryPrice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"},{"internalType":"uint256","name":"_price","type":"uint256"}],"name":"setExpiryPrice","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
var ChainlinkPricerAbiString = '[{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"address","name":"_aggregator","type":"address"},{"internalType":"address","name":"_oracle","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"aggregator","outputs":[{"internalType":"contract AggregatorInterface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"asset","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"oracle","outputs":[{"internalType":"contract OracleInterface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"},{"internalType":"uint80","name":"_roundId","type":"uint80"}],"name":"setExpiryPriceInOracle","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
var AggregatorInterfaceAbiString = '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"int256","name":"current","type":"int256"},{"indexed":true,"internalType":"uint256","name":"roundId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"AnswerUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"roundId","type":"uint256"},{"indexed":true,"internalType":"address","name":"startedBy","type":"address"},{"indexed":false,"internalType":"uint256","name":"startedAt","type":"uint256"}],"name":"NewRound","type":"event"},{"inputs":[],"name":"latestAnswer","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestTimestamp","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRound","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"roundId","type":"uint256"}],"name":"getAnswer","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"roundId","type":"uint256"}],"name":"getTimestamp","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]';

var pricerAddressString = '0xa0647D32deA8bf50bb4CC6d96A91F9F2bbE43EfD,0x908Fa5E6F8E997c32A15eBdBe7377a5a4321918C,0x3b43044cB8b0171290eB87c80b15d132b09e9E84,0x0890E86F880ED85cf821A448e707D47715Dd4378,0xAB8724a8B7Aa145863382fE075bBC325145C1E6B,0x2d483f9a49Dc31471f3bB50B8ebf097E3Ec06F8c,0x32485c33378A1a866c0Bd2085bF622Ab2784Cfef,0x733171b59Ed3839481cd0066076De2C3404EE66A,0x1F89774f01A2786bccCFbA9AF92E53b0B43c743E';
var pricerAssetString = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599,0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9,0x1f9840a85d5af5bf1d1762f925bdaddc4201f984,0x6b3595068778dd592e39a122f4f5a5cf09c90fe2,0x514910771af9ca656af840dff83e8264ecf986ca,0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b,0xbC396689893D065F41bc2C6EcbeE5e0085233447,0xaaaebe6fe48e54f431b0c390cfaf0b017d09d42d';
var aggregatorAddressString = '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c,0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419,0x547a514d5e3769680Ce22B2361c10Ea13619e8a9,0x553303d460EE0afB37EdFf9bE42922D8FF63220e,0xCc70F09A6CC17553b2E31954cD36E4A2d89501f7,0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c,0xD2A593BF7594aCE1faD597adb697b5645d5edDB2,0x01cE1210Fe8153500F60f7131d63239373D7E26C,0x75FbD83b4bd51dEe765b2a01e8D3aa1B020F9d33';


const AddressBookAbi = JSON.parse(AddressBookAbiString);
const OracleAbi = JSON.parse(OracleAbiString);
const ChainlinkPricerAbi = JSON.parse(ChainlinkPricerAbiString);
const AggregatorInterfaceAbi = JSON.parse(AggregatorInterfaceAbiString);

// Entrypoint for the Autotask
exports.handler = async function(credentials) {
    // config
    const relayerAddress = '0xfacb407914655562d6619b0048a612b1795df783';                    // Relayer address
    const addressbookAddress = '0x1E31F2DCBad4dc572004Eae6355fB18F9615cBe4';                // AddressBook module
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