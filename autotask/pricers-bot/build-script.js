const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env')  })
const fetch = require('cross-fetch');
var config = require('./defender-config');
const Web3 = require("web3");
const fs = require('fs');
var replace = require("replace");
var enums = require('./enums');



async function addNewAsset (){

    // accepts 3 inputs - AssetAddress and BotKey and CollateralAddress (optional)

    // get new asset entry and the bot to be updated
    let assetAddress = process.env.npm_config_asset;
    let botKey = process.env.npm_config_bot;
    let collateralAddress = isEmpty(process.env.npm_config_collateral) ? assetAddress : process.env.npm_config_collateral ;

    //validate bot
    let botKeyExists = config.bots.hasOwnProperty(botKey);
    if(!botKeyExists) { console.log("Bot: " + botKey + " does not exist. Please run command view-bots to see available bots or check documentation to create a new one");
    return} 

    let connInfo = getConnectionInfoForBot(botKey);

    await _newBaseAsset(connInfo,assetAddress,collateralAddress)

   
}

async function removeExistingAsset (){

    // accepts 2 inputs - AssetAddress and BotKey
    // get new asset entry and the bot to be updated
    let assetAddress = process.env.npm_config_asset;
    let botKey = process.env.npm_config_bot;

    //validate bot
    let botKeyExists = config.bots.hasOwnProperty(botKey);
    if(!botKeyExists) { console.log("Bot: " + botKey + " does not exist. Please run command view-bots to see available bots or check documentation to create a new one");
    return} 

    let connInfo = getConnectionInfoForBot(botKey);

    _removeFromAssets(connInfo,assetAddress);

}

async function updateBotAsset (){

    // accepts 2 inputs - AssetAddress and BotKey 

    // get new asset entry and the bot to be updated
    let assetAddress = process.env.npm_config_asset;
    let botKey = process.env.npm_config_bot;
    let forceOption = process.env.npm_config_force;
    
    //validate bot
    let botKeyExists = config.bots.hasOwnProperty(botKey);
    if(!botKeyExists) { console.log("Bot: " + botKey + " does not exist. Please run command view-bots to see available bots or check documentation to create a new one");
    return} 

    let connInfo = getConnectionInfoForBot(botKey);

  
    await _newDerivedAsset(connInfo,assetAddress,forceOption)
    
}

function viewBot(){
    let botKey = process.env.npm_config_bot;

    //validate bot
    let botKeyExists = config.bots.hasOwnProperty(botKey);
    if(!botKeyExists) { console.log("Bot: " + botKey + " does not exist. Please run command view-bots to see available bots or check documentation to create a new one");
    return} 
   
    let connInfo = getConnectionInfoForBot(botKey);

    // get asset path
    var outputFilename = "Assets.json";
    let assetsPath = './codebuild/'+connInfo.resourcePath+ '/' +outputFilename;
    const directoryPath = path.join(__dirname, assetsPath);
    
    // get existing assets
    var assetsInfo = _getAssetsFromFile(directoryPath);
    console.log("-------------------------- "+connInfo.name+" ------------------------------------");
    console.log(assetsInfo);
    console.log("-------------------------- "+connInfo.name+" ------------------------------------");
}

// accepts BotKey as an  param
async function syncBotWithDefender(){

    // if bot exists, check existence
    let botKey = process.env.npm_config_bot;


    let botKeyExists = config.bots.hasOwnProperty(botKey);
    if(!botKeyExists) { console.log("Bot: " + botKey + " does not exist. Please run command view-bots to see available bots or check documentation to create a new one");
    return} 

    // fetch bot info
    let connInfo = getConnectionInfoForBot(botKey);

    //get path to script 
    var botAssetType = (connInfo.type  === enums.BaseAsset) ? 'base-asset' : 'derived-asset';
    var pathToScript =  { pathToScript : path.join(__dirname,'./codebuild/'+botAssetType+'/index.js') };
    var pathToScriptDirectory =  { pathToScriptDirectory : path.join(__dirname,'./codebuild/'+botAssetType) };

    // add to bot connection information
    connInfo = {...connInfo, ...pathToScript, ...pathToScriptDirectory};

    // build template
    await _buildTemplate(connInfo);

    // push to defender
    await _pushToDefender(connInfo);

}







function viewBots(){
    console.log("bots:",config.bots);
}

function isEmpty(str) {
    return (!str || str.length === 0 );
}

function isJsonParsable(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}



//--------------------------------------

function getConnectionInfoForBot(botKey){
    let result = {};
    // fetches bot information using key
    let botInfo = config.bots[botKey];

    // loads gamma defaults based on bot's network
    let gammaDefaults =  config.gammaNetworkDefaults[botInfo.chain];

    // return conn info for bot
    result = { ...botInfo, ...gammaDefaults };

    return result;
}

async function _checkIfProductWhitelisted(connInfo, underlying, strike, collateral, isPut = false ){

    const web3 = new Web3(connInfo.nodeUrl);

    let abiPath = './codebuild/'+connInfo.resourcePath+ '/WhitelistAbi.json';

    var whiteListAbi = require(abiPath); 
    const whitelistContractInstance = new web3.eth.Contract(whiteListAbi, connInfo.whitelistAddress);


    let result = false;
    await whitelistContractInstance.methods.isWhitelistedProduct(underlying,strike,collateral,isPut).call(function (err, res) {
        if (err) {
          console.log("An error occured while checking if product is whitelisted", err)
          return
        }
        result = res;
      })
      return result;
}

async function _getPricerForAsset(connInfo, assetAddress){

    const web3 = new Web3(connInfo.nodeUrl);

    let abiPath = './codebuild/'+connInfo.resourcePath+ '/OracleAbi.json';

    var abi = require(abiPath); 
    const contractInstance = new web3.eth.Contract(abi, connInfo.oracleAddress);


    let result = false;
    await contractInstance.methods.getPricer(assetAddress).call(function (err, res) {
        if (err) {
          console.log("An error occured while getting pricer", err)
          return
        }
        result = res;
      })
      return result;
}

async function _getPricerAbi(connInfo, pricerAddress){
    let result ='';
    let explorerApiUrl = connInfo.blockchainExplorerApiUrl + 'module=contract&action=getabi&address=' + pricerAddress + '&apikey=' + connInfo.blockchainExplorerApiKey;

       await (async () => {
            try {
              const res = await fetch(explorerApiUrl);
              if (res.status >= 400) { throw new Error("Bad response from server while fetching pricer address"); }
          
              let resp = await res.json();
              result = resp.result;
             
            } catch (err) {  console.error(err); }
        })();

        return result;
     
}

async function _getUnderlyingInformationFromPricer(connInfo,pricerAddress){

    let result = '';

    var pricerAbi = await _getPricerAbi(connInfo, pricerAddress);
    if(isEmpty(pricerAbi)) { console.log("Pricer: " + pricerAddress + " not found on Gamma (" + connInfo.chain + ")");
    return} 

    if(!isJsonParsable(pricerAbi)){
        console.log("Fetch pricer error:",pricerAbi)
        return
    }

    const abi = JSON.parse(pricerAbi);
    const web3 = new Web3(connInfo.nodeUrl);
    const contractInstance = new web3.eth.Contract(abi, pricerAddress);

    await contractInstance.methods.underlying().call(function (err, res) {
        if (err) {
          console.log("An error occured while underlying address", err)
          return
        }
        result = res;
      });

    return result;
}

async function _getAggregatorandBotInfo(connInfo, pricerAddress){

    let result = {};

    var pricerAbi = await _getPricerAbi(connInfo, pricerAddress);
    if(isEmpty(pricerAbi)) { console.log("Pricer: " + pricerAddress + " not found on Gamma (" + connInfo.chain + ")");
    return} 

    const abi = JSON.parse(pricerAbi);
     const web3 = new Web3(connInfo.nodeUrl);
     const contractInstance = new web3.eth.Contract(abi, pricerAddress);

    
    await contractInstance.methods.aggregator().call(function (err, res) {
        if (err) {
          console.log("An error occured while aggregator address", err)
          return
        }
        result['aggregatorAddress'] = res;
      });

      await contractInstance.methods.bot().call(function (err, res) {
        if (err) {
          console.log("An error occured while bot address", err)
          return
        }
        result['botAddress'] = res;
      });

       return result;
}

function _addToAssets(connInfo, newAssetData){

    // get asset path
    var outputFilename = "Assets.json";
    let assetsPath = './codebuild/'+connInfo.resourcePath+ '/' +outputFilename;
    const directoryPath = path.join(__dirname, assetsPath);

    // get existing assets
    var assetsInfo = _getAssetsFromFile(directoryPath);
   
    // check for previous existence
    if(assetsInfo.some(x => x.AssetAddress === newAssetData.AssetAddress && x.AssetType === connInfo.type)){ 
    console.log("Asset with address: "+ newAssetData.AssetAddress +"on Gamma (" + connInfo.chain + ") already exists...");
    return }

    // add asset if its new
    assetsInfo.push(newAssetData);
     
    //write to file - this overwrites if there's an existing file
    try {
        fs.writeFileSync(directoryPath, JSON.stringify(assetsInfo));
    } catch (err) {
        return console.log(err);
    }

    console.log("Bot:",connInfo.name);
    console.log("Asset Address:",newAssetData.AssetAddress);
    console.log("Pricer Address:",newAssetData.PricerAddress);

    if(connInfo.type === enums.BaseAsset){
        console.log("Aggregator", newAssetData.AggregatorAddress);
    }else {
        console.log("Underlying Address", newAssetData.UnderlyingAddress);
    }
    

    console.log("Bot address(relayer)", newAssetData.BotAddress);
    console.log("----------------------------------------------------");
    console.log("Asset with address " + newAssetData.AssetAddress   + " successfully ADDED locally to Bot:" + connInfo.name + ". Review information above before running the 'sync-bot --botkey' command to push update to defender");
    console.log("----------------------------------------------------");
   

   
}

function _removeFromAssets(connInfo, assetAddress){

    // get asset path
    var outputFilename = "Assets.json";
    let assetsPath = './codebuild/'+connInfo.resourcePath+ '/' +outputFilename;
    const directoryPath = path.join(__dirname, assetsPath);

    // get existing assets
    var assetsInfo = _getAssetsFromFile(directoryPath);

    // removes element by updating the array and returning the removed element
    var assetTobeRemoved;
    for (var i =0; i < assetsInfo.length; i++){
        if (assetsInfo[i].AssetAddress === assetAddress && assetsInfo[i].AssetType == connInfo.type) {
            assetTobeRemoved = assetsInfo.splice(i,1);
            break;
        }
    }

    // check for existence
    if(isEmpty(assetTobeRemoved)){
        console.log("Asset with address: "+ assetAddress +"on Gamma (" + connInfo.chain + ") does not exists on Bot: "+ connInfo.name);
        return }
     
    //write to file - this overwrites if there's an existing file
    try {
        fs.writeFileSync(directoryPath, JSON.stringify(assetsInfo));
    } catch (err) {
        return console.log(err);
    }

    assetTobeRemoved = assetTobeRemoved[0];

    console.log("Bot:",connInfo.name);
    console.log("Asset Address:",assetTobeRemoved.AssetAddress);
    console.log("Pricer Address:",assetTobeRemoved.PricerAddress);
    console.log("Aggregator", assetTobeRemoved.AggregatorAddress);
    console.log("Bot address(relayer)", assetTobeRemoved.BotAddress);
    console.log("----------------------------------------------------");
    console.log("Asset with address " + assetTobeRemoved.AssetAddress   + " successfully REMOVED locally from Bot: " + connInfo.name + ". Review information above before running the 'sync-bot --botkey' command to push update to defender. You can also run the 'view-bot --botkey' to view updated assets on bot");
    console.log("----------------------------------------------------");
   

   
}

async function _newBaseAsset(connInfo, assetAddress,collateralAddress){

       //verify asset whitelisted on gamma 
       var assetWhitelisted = await _checkIfProductWhitelisted(connInfo,assetAddress,connInfo.strikeAddress,collateralAddress,false );
       if(!assetWhitelisted) { console.log("Product with Underlying Asset " + assetAddress + " and Collateral Asset with address: "+ collateralAddress +" and Strike Address: " + connInfo.strikeAddress +" is not whitelisted on Gamma (" + connInfo.chain + ")");
       return} 
   
       //get pricer for asset
       var pricerAddress = await _getPricerForAsset(connInfo,assetAddress);
       if(isEmpty(pricerAddress)) { console.log("Asset: " + assetAddress + " pricer not found on Gamma (" + connInfo.chain + ")");
       return} 
   
       //fetch abi for pricer
       var aggregatorAndBotInfo = await _getAggregatorandBotInfo(connInfo,pricerAddress);
       if(isEmpty(aggregatorAndBotInfo)) { console.log("Aggregator and bot info for pricer with address: " + pricerAddress + " not found on Gamma (" + connInfo.chain + ")");
       return} 
   
       var newAssetData = {
           AssetAddress: assetAddress,
           PricerAddress:pricerAddress,
           AggregatorAddress: aggregatorAndBotInfo.aggregatorAddress,
           BotAddress: aggregatorAndBotInfo.botAddress,
           AddressbookAddress: connInfo.addressBookAddress,
           AssetType: connInfo.type,
           BotKey: connInfo.botKey
       }
   
       _addToAssets(connInfo,newAssetData);

}

async function _newDerivedAsset(connInfo,assetAddress,forceOption) {

          //get pricer for asset
          var pricerAddress = await _getPricerForAsset(connInfo,assetAddress);
          if(isEmpty(pricerAddress)) { console.log("Asset: " + assetAddress + " pricer not found on Gamma (" + connInfo.chain + ")");
          return} 
      
          // get underlying information
          var underlyingAddress = await _getUnderlyingInformationFromPricer(connInfo,pricerAddress);
          if(isEmpty(underlyingAddress)) { console.log("Underlying information for pricer with address: " + pricerAddress + " not found on Gamma (" + connInfo.chain + ")");
          return} 
         
          //verify asset whitelisted on gamma 
          var assetWhitelisted = await _checkIfProductWhitelisted(connInfo, underlyingAddress ,connInfo.strikeAddress,assetAddress,false );
          if(!assetWhitelisted) { console.log("Product with Underlying Asset: " + underlyingAddress + ", Collateral Asset: " + assetAddress  + " and Strike Asset: " + connInfo.strikeAddress +" is not whitelisted on Gamma (" + connInfo.chain + ")");
          return} 
      
      
          var assetData = {
              AssetAddress: assetAddress,
              PricerAddress:pricerAddress,
              UnderlyingAddress: underlyingAddress,
              BotAddress: connInfo.baseAssetDefaultBotAddress,
              AssetType: connInfo.type,
              BotKey: connInfo.botKey
          }
      
          _updateBotAsset(connInfo,assetData,forceOption);

}

function _updateBotAsset(connInfo, newAssetData,forceOption){

    // get asset path
    var outputFilename = "Assets.json";
    let assetsPath = './codebuild/'+connInfo.resourcePath+ '/' +outputFilename;
    const directoryPath = path.join(__dirname, assetsPath);

    // get existing assets
    var assetsInfo = _getAssetsFromFile(directoryPath);
   
    // check for previous existence
    if(assetsInfo.some(x => x.AssetAddress === newAssetData.AssetAddress && x.AssetType === connInfo.type) && !forceOption){ 
    console.log("Asset with address: "+ newAssetData.AssetAddress +"on Gamma (" + connInfo.chain + ") already exists...");
    return }

    // check for bot has another address tied to it 
    if(assetsInfo.some(x => x.AssetType === connInfo.type && x.BotKey === connInfo.botKey) ){ 
        
        if(forceOption){
            // remove asset 
            var assetTobeRemoved;
            for (var i =0; i < assetsInfo.length; i++){
                if (assetsInfo[i].AssetType === connInfo.type && assetsInfo[i].BotKey == connInfo.botKey) {
                    assetTobeRemoved = assetsInfo.splice(i,1);
                    break;
                }
            }        
        }else{
            console.log(  "Bot: "+ connInfo.name +" has an existing asset on Gamma (" + connInfo.chain + ")...Consider running this command with the 'override' option set to 'true' to override existing asset");
            return 
        }
        
       
    }

    // add asset if its new
    assetsInfo.push(newAssetData);
     
    //write to file - this overwrites if there's an existing file
    try {
        fs.writeFileSync(directoryPath, JSON.stringify(assetsInfo));
    } catch (err) {
        return console.log(err);
    }

    console.log("Bot:",connInfo.name);
    console.log("Asset Address:",newAssetData.AssetAddress);
    console.log("Pricer Address:",newAssetData.PricerAddress);
    console.log("Underlying Address", newAssetData.UnderlyingAddress);
    console.log("Bot address(relayer)", newAssetData.BotAddress);
    console.log("----------------------------------------------------");
    console.log("Asset with address " + newAssetData.AssetAddress   + " successfully UPDATED locally to Bot:" + connInfo.name + ". Review information above before running the 'sync-bot --botkey' command to push update to defender");
    console.log("----------------------------------------------------");
   

   
}

function _getAssetsFromFile(directoryPath){

    let resultData = [];

    if (fs.existsSync(directoryPath)) {        
        resultData = require(directoryPath);
    } else {
        //create empty file 
        var dataToWrite = JSON.stringify(resultData);
        try {
            fs.writeFileSync(directoryPath, dataToWrite);
            resultData = require(directoryPath);
        } catch (err) {
            return console.log(err);
        }
    }

    return resultData;

}

async function _buildTemplate(connInfo){

    // fetch temp ABi defaults - AddressBook
    _buildTemplate_AddressBook(connInfo);

    // fetch temp ABi defaults - Oracle
    _buildTemplate_Oracle(connInfo); 


    if(connInfo.type == enums.BaseAsset){

        // fetch temp ABi defaults - ChainkLinkPricer
        _buildTemplate_ChainkLinkPricer(connInfo); 

        // fetch temp ABi defaults - AggregatorInterfaceAbi
        _buildTemplate_AggregatorInterfaceAbi(connInfo); 

    } 

    // load config
   await _buildConfigAndAssets(connInfo);

}

function _buildTemplate_AddressBook(connInfo){

    let filePath = './codebuild/'+connInfo.resourcePath+ '/AddressBookAbi.json';
    const directoryPath = path.join(__dirname, filePath);

    if (!fs.existsSync(directoryPath)) {    
        console.log("Address Book Abi file not found. Please run update cli command for Gamma defaults");
        return}

    var abiData = require(directoryPath);
    var abiString = JSON.stringify(abiData);

    if(!isJsonParsable(abiString)){
        console.log("Address Book Abi file could not be parsed. Please check for trailing commas in the json file")
        return
    }

    replace({
        regex: "(?<=var AddressBookAbiString = ')(.*?)(?=')",
        replacement: abiString,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
      });

}

function _buildTemplate_Oracle(connInfo){

    let filePath = './codebuild/'+connInfo.resourcePath+ '/OracleAbi.json';
    const directoryPath = path.join(__dirname, filePath);

    if (!fs.existsSync(directoryPath)) {    
        console.log("Oracle Abi file not found. Please run update cli command for Gamma defaults");
        return}

    var abiData = require(directoryPath);
    var abiString = JSON.stringify(abiData);

    if(!isJsonParsable(abiString)){
        console.log("Oracle Abi file could not be parsed. Please check for trailing commas in the json file")
        return
    }

    replace({
        regex: "(?<=var OracleAbiString = ')(.*?)(?=')",
        replacement: abiString,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
      });

}

function _buildTemplate_ChainkLinkPricer(connInfo){

    let filePath = './codebuild/'+connInfo.resourcePath+ '/ChainlinkPricerAbi.json';
    const directoryPath = path.join(__dirname, filePath);

    if (!fs.existsSync(directoryPath)) {    
        console.log("ChainlinkPricer Abi file not found. Please run update cli command for Gamma defaults");
        return}

    var abiData = require(directoryPath);
    var abiString = JSON.stringify(abiData);

    if(!isJsonParsable(abiString)){
        console.log("ChainlinkPricer Abi file could not be parsed. Please check for trailing commas in the json file")
        return
    }

    replace({
        regex: "(?<=var ChainlinkPricerAbiString = ')(.*?)(?=')",
        replacement: abiString,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
      });
}

function _buildTemplate_AggregatorInterfaceAbi(connInfo){

    let filePath = './codebuild/'+connInfo.resourcePath+ '/AggregatorInterfaceAbi.json';
    const directoryPath = path.join(__dirname, filePath);

    if (!fs.existsSync(directoryPath)) {    
        console.log("AggregatorInterface  Abi file not found. Please run update cli command for Gamma defaults");
        return}

    var abiData = require(directoryPath);
    var abiString = JSON.stringify(abiData);

    if(!isJsonParsable(abiString)){
        console.log("AggregatorInterface Abi file could not be parsed. Please check for trailing commas in the json file")
        return
    }

    replace({
        regex: "(?<=var AggregatorInterfaceAbiString = ')(.*?)(?=')",
        replacement: abiString,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
      });
}

async function _buildConfigAndAssets(connInfo){

    //update relayer 
    var relayerAddress = connInfo.baseAssetDefaultBotAddress;
    replace({
        regex: "(?<=const relayerAddress = ')(.*?)(?=')",
        replacement: relayerAddress,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
      });


    //update address book
    var addressbookAddress = connInfo.addressBookAddress;
    replace({
        regex: "(?<=const addressbookAddress = ')(.*?)(?=')",
        replacement: addressbookAddress,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
      });


    // fetch asset, pricers and aggregator info
    let assetsPath = './codebuild/'+connInfo.resourcePath+ '/Assets.json';
    const directoryPath = path.join(__dirname, assetsPath);

    // get existing assets
    var assetsInfo = _getAssetsFromFile(directoryPath);

    if(connInfo.type == enums.BaseAsset){
        _buildConfigAndBaseAssets(connInfo, assetsInfo);
    }else {
       await _buildConfigAndDerivedAssets(connInfo, assetsInfo)
    }

}

function _buildConfigAndBaseAssets(connInfo,assetsInfo){

    let pricerAddressArray = [];
    let pricerAssetArray = [];
    let aggregatorAddressArray = [];
    
    assetsInfo.forEach(element => {

        if(element.PricerAddress && element.AssetType == enums.BaseAsset && element.BotKey == connInfo.botKey){
            pricerAddressArray.push(element.PricerAddress);
        }

        if(element.AssetAddress && element.AssetType == enums.BaseAsset && element.BotKey == connInfo.botKey){
            pricerAssetArray.push(element.AssetAddress);
        }

        if(element.AggregatorAddress && element.AssetType == enums.BaseAsset && element.BotKey == connInfo.botKey){
            aggregatorAddressArray.push(element.AggregatorAddress);
        }

    });

    //update asset, pricers and aggregator info'
    replace({
        regex: "(?<=var pricerAddressString = ')(.*?)(?=';)",
        replacement: pricerAddressArray,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
      });

    replace({
        regex: "(?<=var pricerAssetString = ')(.*?)(?=';)",
        replacement: pricerAssetArray,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
    });

    replace({
        regex: "(?<=var aggregatorAddressString = ')(.*?)(?=';)",
        replacement: aggregatorAddressArray,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
    });
}

async function _buildConfigAndDerivedAssets(connInfo,assetsInfo){

    let pricerAddressArray = [];
    let pricerAssetArray = [];
    let underlyingAssetAddressArray = [];
    
    assetsInfo.forEach(element => {

        if(element.PricerAddress && element.AssetType == enums.DerivedAsset && element.BotKey == connInfo.botKey){
            pricerAddressArray.push(element.PricerAddress);
        }

        if(element.AssetAddress && element.AssetType == enums.DerivedAsset && element.BotKey == connInfo.botKey){
            pricerAssetArray.push(element.AssetAddress);
        }

        if(element.UnderlyingAddress && element.AssetType == enums.DerivedAsset && element.BotKey == connInfo.botKey){
            underlyingAssetAddressArray.push(element.UnderlyingAddress);
        }

    });

    // fetch derived asset abi 
    var pricerAbi = await _getPricerAbi(connInfo, pricerAddressArray[0]);
    if(isEmpty(pricerAbi)) { console.log("Pricer: " + pricerAddress + " not found on Gamma (" + connInfo.chain + ")");
    return} 

  //  var abiString = JSON.stringify(pricerAbi);

    if(!isJsonParsable(pricerAbi)){
        console.log("Pricer Abi file could not be parsed. Please check for trailing commas in the json file")
        return
    }

    replace({
        regex: "(?<=var PricerAbiString = ')(.*?)(?=')",
        replacement: pricerAbi,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
      });


    //update asset, pricers and underlyingAsset info'
    replace({
        regex: "(?<=const pricerAddress = ')(.*?)(?=')",
        replacement: pricerAddressArray,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
      });

    replace({
        regex: "(?<=const pricerAsset = ')(.*?)(?=')",
        replacement: pricerAssetArray,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
    });

    replace({
        regex: "(?<=const underlyingAsset = ')(.*?)(?=')",
        replacement: underlyingAssetAddressArray,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
    });
}

async function _pushToDefender(connInfo) {

    // defender api keys 
    const { AutotaskClient } = require('defender-autotask-client');
    const client = new AutotaskClient({apiKey: process.env.AUTOTASK_API_KEY, apiSecret: process.env.AUTOTASK_API_SECRET});
    
    // bot identifier
    const autoTaskId = connInfo.autoTaskId;

    // register user pushing the update 
    var email = require('git-user-email');
    var syncInformation = " "+email() + " performed sync using autoclient on " + new Date().toString(); 
   
    replace({
        regex: "(?<=Cli Gamma Sync Information =)(.*?)(?=;)",
        replacement: syncInformation,
        paths: [connInfo.pathToScript],
        recursive: false,
        silent: false,
    });


    // perform push
    try {
      let response =  await client.updateCodeFromFolder(autoTaskId, connInfo.pathToScriptDirectory);
      let botInfo = { Bot: connInfo.name}
      console.log("----------------------------------------------------");
      console.log(JSON.stringify({...botInfo,...response}));
      console.log("----------------------------------------------------");

    } catch(err) {
        console.log(JSON.stringify(err));
    }
  }

  
for (var i=0; i<process.argv.length;i++) {
    switch (process.argv[i]) {
      case 'bots':
        viewBots();
        break;
      case 'new':
        addNewAsset();
        break;
      case 'update':
        updateBotAsset();
        break;
      case 'sync':
        syncBotWithDefender();
        break;
      case 'remove':
        removeExistingAsset();
        break;
      case 'botassets':
        viewBot();
        break;
    }
}

module.exports.viewBots = viewBots;
module.exports.addNewAsset = addNewAsset;
module.exports.updateBotAsset = updateBotAsset;
module.exports.syncBotWithDefender = syncBotWithDefender;
module.exports.removeExistingAsset = removeExistingAsset;
module.exports.viewBot = viewBot;
