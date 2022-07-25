const { ethers } = require("ethers");
const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');

// Cli Gamma Sync Information = null performed sync using autoclient on Thu Feb 03 2022 02:35:46 GMT+0100 (West Africa Standard Time);

var AddressBookAbiString = '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":false,"internalType":"address","name":"add","type":"address"}],"name":"AddressAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":false,"internalType":"address","name":"proxy","type":"address"}],"name":"ProxyCreated","type":"event"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getOtokenImpl","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOtokenFactory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getWhitelist","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getController","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMarginPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMarginCalculator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getLiquidationManager","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOracle","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_otokenImpl","type":"address"}],"name":"setOtokenImpl","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_otokenFactory","type":"address"}],"name":"setOtokenFactory","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_whitelist","type":"address"}],"name":"setWhitelist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_controller","type":"address"}],"name":"setController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_marginPool","type":"address"}],"name":"setMarginPool","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_marginCalculator","type":"address"}],"name":"setMarginCalculator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_liquidationManager","type":"address"}],"name":"setLiquidationManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_oracle","type":"address"}],"name":"setOracle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"}],"name":"getAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"},{"internalType":"address","name":"_address","type":"address"}],"name":"setAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_id","type":"bytes32"},{"internalType":"address","name":"_newAddress","type":"address"}],"name":"updateImpl","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
var OracleAbiString = '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newDisputer","type":"address"}],"name":"DisputerUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":true,"internalType":"uint256","name":"expiryTimestamp","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"disputedPrice","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newPrice","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"disputeTimestamp","type":"uint256"}],"name":"ExpiryPriceDisputed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":true,"internalType":"uint256","name":"expirtyTimestamp","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"price","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"onchainTimestamp","type":"uint256"}],"name":"ExpiryPriceUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"pricer","type":"address"},{"indexed":false,"internalType":"uint256","name":"disputePeriod","type":"uint256"}],"name":"PricerDisputePeriodUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"pricer","type":"address"},{"indexed":false,"internalType":"uint256","name":"lockingPeriod","type":"uint256"}],"name":"PricerLockingPeriodUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"asset","type":"address"},{"indexed":false,"internalType":"address","name":"pricer","type":"address"}],"name":"PricerUpdated","type":"event"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"}],"name":"getPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"}],"name":"getExpiryPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"}],"name":"getPricer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getDisputer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_pricer","type":"address"}],"name":"getPricerLockingPeriod","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_pricer","type":"address"}],"name":"getPricerDisputePeriod","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"}],"name":"isLockingPeriodOver","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"}],"name":"isDisputePeriodOver","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"address","name":"_pricer","type":"address"}],"name":"setAssetPricer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_pricer","type":"address"},{"internalType":"uint256","name":"_lockingPeriod","type":"uint256"}],"name":"setLockingPeriod","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_pricer","type":"address"},{"internalType":"uint256","name":"_disputePeriod","type":"uint256"}],"name":"setDisputePeriod","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_disputer","type":"address"}],"name":"setDisputer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"},{"internalType":"uint256","name":"_price","type":"uint256"}],"name":"disputeExpiryPrice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_asset","type":"address"},{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"},{"internalType":"uint256","name":"_price","type":"uint256"}],"name":"setExpiryPrice","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
var PricerAbiString = '[{"inputs":[{"internalType":"address","name":"_lpToken","type":"address"},{"internalType":"address","name":"_underlying","type":"address"},{"internalType":"address","name":"_oracle","type":"address"},{"internalType":"address","name":"_curve","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"curve","outputs":[{"internalType":"contract ICurve","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint80","name":"","type":"uint80"}],"name":"getHistoricalPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"getPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lpToken","outputs":[{"internalType":"contract IStakeDao","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"oracle","outputs":[{"internalType":"contract OracleInterface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_expiryTimestamp","type":"uint256"}],"name":"setExpiryPriceInOracle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"underlying","outputs":[{"internalType":"contract ERC20Interface","name":"","type":"address"}],"stateMutability":"view","type":"function"}]';

const AddressBookAbi = JSON.parse(AddressBookAbiString);
const OracleAbi = JSON.parse(OracleAbiString);
const pricerAbi = JSON.parse(PricerAbiString);

// Entrypoint for the Autotask
exports.handler = async function(credentials) {
  	// config
    const relayerAddress = '0xfacb407914655562d6619b0048a612b1795df783';                    // Relayer address
    const addressbookAddress = '0x1E31F2DCBad4dc572004Eae6355fB18F9615cBe4';                // AddressBook module
    const pricerAddress = '0x27a8ee0Eb39AEe580490da00ab60eCfAB2a02C40';                     // Yearn pricer
    const pricerAsset = '0xa2761b0539374eb7af2155f76eb09864af075250';                       // yUSDC address
    const underlyingAsset = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

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
    // pricer instance
    const pricer = new ethers.Contract(pricerAddress, pricerAbi, signer);
    // Otoken expiry hour in UTC
    const expiryHour = 8;

    console.log('Oracle: ', oracle.address);
    console.log('Pricer: ', pricer.address);
    console.log('Pricer asset: ', pricerAsset);

    // set expiry timestamp
    let expiryTimestamp = new Date();
    expiryTimestamp.setHours(expiryHour);
    expiryTimestamp.setMinutes(0);
    expiryTimestamp.setSeconds(0);
    expiryTimestamp = Math.floor(expiryTimestamp.getTime() / 1000);

    // current timestamp in UTC seconds
    let currentTimestamp = new Date();
    const hour = currentTimestamp.getHours()
    const weekday = currentTimestamp.toLocaleString("default", { weekday: "long" })
    currentTimestamp = Math.floor(currentTimestamp.getTime() / 1000);

    console.log('Expiry timestamp: ', expiryTimestamp.toString())
    console.log('Current timestamp: ', currentTimestamp);
    console.log('Current hour: ', hour);
	
    if((hour >= expiryHour) && (weekday == 'Friday')) {
        let underlyingPrice = await oracle.getExpiryPrice(underlyingAsset, expiryTimestamp)

        if (underlyingPrice[0].toString() != '0') {
            let expiryPrice = await oracle.getExpiryPrice(pricerAsset, expiryTimestamp);
            let isLockingPeriodOver = await oracle.isLockingPeriodOver(pricerAsset, expiryTimestamp);

            if (expiryPrice[0].toString() == '0' && isLockingPeriodOver) {
                console.log('pushing yearn asset price')

                let tx = await pricer.setExpiryPriceInOracle(expiryTimestamp, {gasLimit: '1000000'});

                console.log('Tx hash: ', tx.hash);
            }
            else {
                console.log('Can\'t push price, already exist or locking period not over yet!');
            }
        }
        else {
            console.log('Underlying price not found in oracle!')
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