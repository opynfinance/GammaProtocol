using OtokenHarnessA as shortOtoken
using OtokenHarnessB as longOtoken
using DummyERC20C as collateralToken
using MarginPoolHarness as pool

methods {
    // The tracked asset balance of the system
    pool.getStoredBalance(address) returns uint256 envfree
    // The asset balance of MarginPool. i.e.,  asset.balanceOf(MarginPool)
    assetBalanceOfPool(address) returns uint256 envfree
    // The asset (first param) balance of account (second param)
    assetBalanceOf(address, address) returns uint256 envfree
    // The total supply of an asset. i.e., asset.totalSupply()
    assetTotalSupply(address) returns uint256 envfree
    // The amount of collateral in an index in a vault of an owner. i.e.,  vaults[owner][index].collateralAmounts[i]
    getVaultCollateralAmount(address, uint256, uint256)  returns uint256 envfree
    // The collateral asset of an index in a vault of an owner. i.e., vaults[owner][index].collateralAssets(i)
    getVaultCollateralAsset(address, uint256, uint256)  returns address envfree
    // The amount of long in an index in a vault of an owner. i.e.,  vaults[owner][index].longAmounts[i]
    getVaultLongAmount(address, uint256, uint256)  returns uint256 envfree
    // The long oToken in an index in a vault of an owner. i.e.,  vaults[owner][index].longOtoken[i]
    getVaultLongOtoken(address, uint256, uint256)  returns address envfree
    // The amount of long in an index in a vault of an owner. i.e.,  vaults[owner][index].shortAmounts[i]
    getVaultShortAmount(address, uint256, uint256)  returns uint256 envfree
    // The long oToken in an index in a vault of an owner. i.e.,  vaults[owner][index].shortOtoken[i]
    getVaultShortOtoken(address, uint256, uint256)  returns address envfree
    // Checks if the vault is expired (true when there is an otoken which we can check expiry for)
    isVaultExpired(address, uint256) returns bool
    // The strike price of OtokenHarnessA 
    shortOtoken.strikePrice() returns uint256 envfree
    // The strick price of OtokenHarnessB
    longOtoken.strikePrice() returns uint256 envfree
    // Arbitrary change a vault, total supply of otoken, system balance  
    longOtoken.havocTotalSupply(uint256) envfree
    shortOtoken.havocTotalSupply(uint256) envfree
    pool.havocSystemBalance(address) envfree
    havocVault(address, uint256, uint256, uint256, uint256, uint256 ) envfree
    anOtokenA() returns address envfree
    anOtokenB() returns address envfree
    dummyERC20C() returns address envfree
}




/**
@title No bankruptcy
@notice 
The asset balance of the system is more than the obligations in this asset.
For every oToken, the obligation is for the balance held by users as the system holds the oToken that is used as long. This is computed as the total supply minus the balance of the system (representing that have not transferred to the system as long.

For put options before expiry (strong bound): 
obligation(o) ≡ 
	(o.totalSupply() - storedBalance(o)) * o.strikePriceIn(asset) 

storedBalance(asset) ≥ ∑o ∈ O_asset. obligation(o)
where O_asset  is the set of oTokens with asset as ColleteralAsset
Oasset ≡ { o ∈ oTokens.  o.CollateralAsset = asset }

This rule is proven relaying on:
1. a proof with Mathemtic minValue to compute the debt a vault
2. a rule that shows that one vault is changed at a time
3. rules that show valid balances of the system with respect to vault changes


Due to complexity for the SMT solver the rules is split to three cases of a valid vault:
    if( longAmount <= shortAmount && longAmount * longPrice <=  shortAmount * shortPrice )  //case 1
         debt =  shortAmount * shortPrice  -  longAmount *  longPrice ; 
    else if ( longAmount > shortAmount_ && longPrice < shortPrice)  //case 2
          debt =   shortAmount * (shortPrice - longPrice) ;
    else //case 3
        debt = 0;
*/

rule putOptionsPreExpiryCase1StartingWithAllCases(
    address owner,
    uint256 vaultId,
    uint256 index,
    address asset,
    uint256 _shortAmount,
    uint256 _longAmount,
    uint256 _collateral,
    uint256 _poolAssetBalance,
    uint256 _poolShortOtokenBalance,
    uint256 _poolLongOtokenBalance,
    uint256 _totalSupplyShortOtoken,
    uint256 _totalSupplyLongOtoken,
    uint256 shortPrice,
    uint256 longPrice,
    uint256 shortAmount_,
    uint256 longAmount_,
    uint256 collateral_,
    uint256 poolAssetBalance_,
    uint256 poolShortOtokenBalance_,
    uint256 poolLongOtokenBalance_,
    uint256 totalSupplyShortOtoken_,
    uint256 totalSupplyLongOtoken_
) {
    links();
    env e;
    require shortOtoken == getVaultShortOtoken(owner, vaultId, index);
    require longOtoken == getVaultLongOtoken(owner, vaultId, index);
    require collateralToken == getVaultCollateralAsset(owner, vaultId, index);
    require asset == collateralToken;

    require _shortAmount == getVaultShortAmount(owner, vaultId, index);
    require _longAmount == getVaultLongAmount(owner, vaultId, index);
    require _collateral == getVaultCollateralAmount(owner, vaultId, index);
    require _poolAssetBalance == pool.getStoredBalance(asset);
    require _poolShortOtokenBalance == pool.getStoredBalance(shortOtoken);
    require _poolLongOtokenBalance == pool.getStoredBalance(longOtoken);
    require _totalSupplyShortOtoken == assetTotalSupply(shortOtoken);
    require _totalSupplyLongOtoken == assetTotalSupply(longOtoken);
    require shortPrice == shortOtoken.strikePrice();
    require longPrice == longOtoken.strikePrice();

    // assume before expiry
    require !isVaultExpired(e, owner, vaultId);

    // assume no bankruptcy
	mathint _obligation = (_totalSupplyShortOtoken - _poolShortOtokenBalance ) * shortPrice
                                         +  (_totalSupplyLongOtoken -  _poolLongOtokenBalance ) * longPrice;
    require _poolAssetBalance >= _obligation ;

    // based on Mathematica proof:
    mathint _debt = 0;
    if( _longAmount <= _shortAmount && ( _longAmount * longPrice <= _shortAmount * shortPrice )) {
            _debt = _shortAmount * shortPrice  -  _longAmount *  longPrice ;
    } else if ( _longAmount > _shortAmount && longPrice < shortPrice) {
            _debt = _shortAmount * (shortPrice - longPrice) ;
    }
    //assume vault is in a valid state
    require _collateral >= _debt ;


    //assume valid state based on  valid balances rules
    require ( _totalSupplyShortOtoken >= _poolShortOtokenBalance + _shortAmount) &&
              _totalSupplyLongOtoken >= _poolLongOtokenBalance &&
              _poolLongOtokenBalance >= _longAmount &&
              _poolAssetBalance >= _collateral ;

	//compute excess collateral of other vaults
	mathint _obligationWithoutThisVault = (_totalSupplyShortOtoken - _poolShortOtokenBalance - _shortAmount) * shortPrice
                                             +  (_totalSupplyLongOtoken -  _poolLongOtokenBalance +_longAmount ) * longPrice  ;

    // assume excess collateral of other vaults is not cover by this vault's collateral
    require ( _poolAssetBalance - _collateral >= _obligationWithoutThisVault );

	
    // simulate many operations in one step
    uint256 newShortAmount;
    uint256 newLongAmount;
    uint256 newcollateralAmount;
    uint256 newTotalSupply;
    sinvoke havocVault(owner, vaultId, index, newShortAmount, newLongAmount, newcollateralAmount); 
    sinvoke pool.havocSystemBalance(longOtoken);
    sinvoke pool.havocSystemBalance(asset);
    sinvoke shortOtoken.havocTotalSupply(newTotalSupply);


    require shortAmount_ == getVaultShortAmount(owner, vaultId, index);
    require longAmount_ == getVaultLongAmount(owner, vaultId, index);
    require collateral_ == getVaultCollateralAmount(owner, vaultId, index);
    require poolAssetBalance_ == pool.getStoredBalance(asset);
    require poolShortOtokenBalance_ == pool.getStoredBalance(shortOtoken);
    require poolLongOtokenBalance_ == pool.getStoredBalance(longOtoken);
    require totalSupplyShortOtoken_ == assetTotalSupply(shortOtoken);
    require totalSupplyLongOtoken_ == assetTotalSupply(longOtoken);

    mathint obligation_ = (totalSupplyShortOtoken_ - poolShortOtokenBalance_ ) * shortPrice
                                                 +  (totalSupplyLongOtoken_ -  poolLongOtokenBalance_ ) * longPrice  ;


    //assume isValid vault case 1
    require longAmount_ <= shortAmount_ && longAmount_ * longPrice <=  shortAmount_ * shortPrice ;
    mathint debt_ =  shortAmount_ * shortPrice  -  longAmount_ *  longPrice ;
   
    //assume vault is in a valid state
    require collateral_ >= debt_ ;

    // valid state - need to prove this as in invariant also when the vault is not valid should hold
    require  (totalSupplyShortOtoken_ >=  poolShortOtokenBalance_ + shortAmount_) &&
             totalSupplyLongOtoken_  >=  poolLongOtokenBalance_  &&
             poolLongOtokenBalance_ >= longAmount_ &&
             poolAssetBalance_ >= collateral_ ;

    // assume changes are coherent based on total required rules
    require collateral_ - _collateral ==  poolAssetBalance_-  _poolAssetBalance;
    require longAmount_ - _longAmount == poolLongOtokenBalance_ -  _poolLongOtokenBalance;
    require shortAmount_ - _shortAmount ==  totalSupplyShortOtoken_ - _totalSupplyShortOtoken;

    //verify no bankruptchy 
    assert poolAssetBalance_ >= obligation_ ;
}


rule putOptionsPreExpiryCase2StartingWithAllCases(
    address owner,
    uint256 vaultId,
    uint256 index,
    address asset,
    uint256 _shortAmount,
    uint256 _longAmount,
    uint256 _collateral,
    uint256 _poolAssetBalance,
    uint256 _poolShortOtokenBalance,
    uint256 _poolLongOtokenBalance,
    uint256 _totalSupplyShortOtoken,
    uint256 _totalSupplyLongOtoken,
    uint256 shortPrice,
    uint256 longPrice,
    uint256 shortAmount_,
    uint256 longAmount_,
    uint256 collateral_,
    uint256 poolAssetBalance_,
    uint256 poolShortOtokenBalance_,
    uint256 poolLongOtokenBalance_,
    uint256 totalSupplyShortOtoken_,
    uint256 totalSupplyLongOtoken_
) {
    links();
    env e;
    require shortOtoken == getVaultShortOtoken(owner, vaultId, index);
    require longOtoken == getVaultLongOtoken(owner, vaultId, index);
    require collateralToken == getVaultCollateralAsset(owner, vaultId, index);
    require asset == collateralToken;

    require _shortAmount == getVaultShortAmount(owner, vaultId, index);
    require _longAmount == getVaultLongAmount(owner, vaultId, index);
    require _collateral == getVaultCollateralAmount(owner, vaultId, index);
    require _poolAssetBalance == pool.getStoredBalance(asset);
    require _poolShortOtokenBalance == pool.getStoredBalance(shortOtoken);
    require _poolLongOtokenBalance == pool.getStoredBalance(longOtoken);
    require _totalSupplyShortOtoken == assetTotalSupply(shortOtoken);
    require _totalSupplyLongOtoken == assetTotalSupply(longOtoken);
    require shortPrice == shortOtoken.strikePrice();
    require longPrice == longOtoken.strikePrice();

    // assume before expiry
    require !isVaultExpired(e, owner, vaultId);

    // assume no bankruptcy
	mathint _obligation = (_totalSupplyShortOtoken - _poolShortOtokenBalance ) * shortPrice
                                         +  (_totalSupplyLongOtoken -  _poolLongOtokenBalance ) * longPrice;
    require _poolAssetBalance >= _obligation ;

    // based on Mathematica proof:
    mathint _debt = 0;
    if( _longAmount <= _shortAmount && ( _longAmount * longPrice <= _shortAmount * shortPrice )) {
            _debt = _shortAmount * shortPrice  -  _longAmount *  longPrice ;
    } else if ( _longAmount > _shortAmount && longPrice < shortPrice) {
            _debt = _shortAmount * (shortPrice - longPrice) ;
    }
    //assume vault is in a valid state
    require _collateral >= _debt ;


    //assume valid state based on  valid balances rules
    require ( _totalSupplyShortOtoken >= _poolShortOtokenBalance + _shortAmount) &&
              _totalSupplyLongOtoken >= _poolLongOtokenBalance &&
              _poolLongOtokenBalance >= _longAmount &&
              _poolAssetBalance >= _collateral ;

	//compute excess collateral of other vaults
	mathint _obligationWithoutThisVault = (_totalSupplyShortOtoken - _poolShortOtokenBalance - _shortAmount) * shortPrice
                                             +  (_totalSupplyLongOtoken -  _poolLongOtokenBalance +_longAmount ) * longPrice  ;

    // assume excess collateral of other vaults is not cover by this vault's collateral
    require ( _poolAssetBalance - _collateral >= _obligationWithoutThisVault );

	
    // simulate many operations in one step
    uint256 newShortAmount;
    uint256 newLongAmount;
    uint256 newcollateralAmount;
    uint256 newTotalSupply;
    sinvoke havocVault(owner, vaultId, index, newShortAmount, newLongAmount, newcollateralAmount); 
    sinvoke pool.havocSystemBalance(longOtoken);
    sinvoke pool.havocSystemBalance(asset);
    sinvoke shortOtoken.havocTotalSupply(newTotalSupply);


    require shortAmount_ == getVaultShortAmount(owner, vaultId, index);
    require longAmount_ == getVaultLongAmount(owner, vaultId, index);
    require collateral_ == getVaultCollateralAmount(owner, vaultId, index);
    require poolAssetBalance_ == pool.getStoredBalance(asset);
    require poolShortOtokenBalance_ == pool.getStoredBalance(shortOtoken);
    require poolLongOtokenBalance_ == pool.getStoredBalance(longOtoken);
    require totalSupplyShortOtoken_ == assetTotalSupply(shortOtoken);
    require totalSupplyLongOtoken_ == assetTotalSupply(longOtoken);

    mathint obligation_ = (totalSupplyShortOtoken_ - poolShortOtokenBalance_ ) * shortPrice
                                                 +  (totalSupplyLongOtoken_ -  poolLongOtokenBalance_ ) * longPrice  ;


    //assume isValid vault case 2
    require longAmount_ > shortAmount_ && longPrice < shortPrice ;
    mathint debt_ =  shortAmount_ * shortPrice  -  longAmount_ *  longPrice ;
   
    //assume vault is in a valid state
    require collateral_ >= debt_ ;

    // valid state - need to prove this as in invariant also when the vault is not valid should hold
    require  (totalSupplyShortOtoken_ >=  poolShortOtokenBalance_ + shortAmount_) &&
             totalSupplyLongOtoken_  >=  poolLongOtokenBalance_  &&
             poolLongOtokenBalance_ >= longAmount_ &&
             poolAssetBalance_ >= collateral_ ;

    // assume changes are coherent based on total required rules
    require collateral_ - _collateral ==  poolAssetBalance_-  _poolAssetBalance;
    require longAmount_ - _longAmount == poolLongOtokenBalance_ -  _poolLongOtokenBalance;
    require shortAmount_ - _shortAmount ==  totalSupplyShortOtoken_ - _totalSupplyShortOtoken;

    //verify no bankruptchy 
    assert poolAssetBalance_ >= obligation_ ;
}

rule putOptionsPreExpiryCase3StartingWithAllCases(
    address owner,
    uint256 vaultId,
    uint256 index,
    address asset,
    uint256 _shortAmount,
    uint256 _longAmount,
    uint256 _collateral,
    uint256 _poolAssetBalance,
    uint256 _poolShortOtokenBalance,
    uint256 _poolLongOtokenBalance,
    uint256 _totalSupplyShortOtoken,
    uint256 _totalSupplyLongOtoken,
    uint256 shortPrice,
    uint256 longPrice,
    uint256 shortAmount_,
    uint256 longAmount_,
    uint256 collateral_,
    uint256 poolAssetBalance_,
    uint256 poolShortOtokenBalance_,
    uint256 poolLongOtokenBalance_,
    uint256 totalSupplyShortOtoken_,
    uint256 totalSupplyLongOtoken_
) {
    links();
    env e;
    require shortOtoken == getVaultShortOtoken(owner, vaultId, index);
    require longOtoken == getVaultLongOtoken(owner, vaultId, index);
    require collateralToken == getVaultCollateralAsset(owner, vaultId, index);
    require asset == collateralToken;

    require _shortAmount == getVaultShortAmount(owner, vaultId, index);
    require _longAmount == getVaultLongAmount(owner, vaultId, index);
    require _collateral == getVaultCollateralAmount(owner, vaultId, index);
    require _poolAssetBalance == pool.getStoredBalance(asset);
    require _poolShortOtokenBalance == pool.getStoredBalance(shortOtoken);
    require _poolLongOtokenBalance == pool.getStoredBalance(longOtoken);
    require _totalSupplyShortOtoken == assetTotalSupply(shortOtoken);
    require _totalSupplyLongOtoken == assetTotalSupply(longOtoken);
    require shortPrice == shortOtoken.strikePrice();
    require longPrice == longOtoken.strikePrice();

    // assume before expiry
    require !isVaultExpired(e, owner, vaultId);

    // assume no bankruptcy
	mathint _obligation = (_totalSupplyShortOtoken - _poolShortOtokenBalance ) * shortPrice
                                         +  (_totalSupplyLongOtoken -  _poolLongOtokenBalance ) * longPrice;
    require _poolAssetBalance >= _obligation ;

    // based on Mathematica proof:
    mathint _debt = 0;
    require( _longAmount <= _shortAmount && ( _longAmount * longPrice <= _shortAmount * shortPrice )); // {
            _debt = _shortAmount * shortPrice  -  _longAmount *  longPrice ;
    /*} else if ( _longAmount > _shortAmount && longPrice < shortPrice) {
            _debt = _shortAmount * (shortPrice - longPrice) ;
    }*/
    //assume vault is in a valid state
    require _collateral >= _debt ;


    //assume valid state based on  valid balances rules
    require ( _totalSupplyShortOtoken >= _poolShortOtokenBalance + _shortAmount) &&
              _totalSupplyLongOtoken >= _poolLongOtokenBalance &&
              _poolLongOtokenBalance >= _longAmount &&
              _poolAssetBalance >= _collateral ;

	//compute excess collateral of other vaults
	mathint _obligationWithoutThisVault = (_totalSupplyShortOtoken - _poolShortOtokenBalance - _shortAmount) * shortPrice
                                             +  (_totalSupplyLongOtoken -  _poolLongOtokenBalance +_longAmount ) * longPrice  ;

    // assume excess collateral of other vaults is not cover by this vault's collateral
    require ( _poolAssetBalance - _collateral >= _obligationWithoutThisVault );

	
    // simulate many operations in one step
    uint256 newShortAmount;
    uint256 newLongAmount;
    uint256 newcollateralAmount;
    uint256 newTotalSupply;
    sinvoke havocVault(owner, vaultId, index, newShortAmount, newLongAmount, newcollateralAmount); 
    sinvoke pool.havocSystemBalance(longOtoken);
    sinvoke pool.havocSystemBalance(asset);
    sinvoke shortOtoken.havocTotalSupply(newTotalSupply);


    require shortAmount_ == getVaultShortAmount(owner, vaultId, index);
    require longAmount_ == getVaultLongAmount(owner, vaultId, index);
    require collateral_ == getVaultCollateralAmount(owner, vaultId, index);
    require poolAssetBalance_ == pool.getStoredBalance(asset);
    require poolShortOtokenBalance_ == pool.getStoredBalance(shortOtoken);
    require poolLongOtokenBalance_ == pool.getStoredBalance(longOtoken);
    require totalSupplyShortOtoken_ == assetTotalSupply(shortOtoken);
    require totalSupplyLongOtoken_ == assetTotalSupply(longOtoken);

    mathint obligation_ = (totalSupplyShortOtoken_ - poolShortOtokenBalance_ ) * shortPrice
                                                 +  (totalSupplyLongOtoken_ -  poolLongOtokenBalance_ ) * longPrice  ;


    //assume isValid vault case 3
    require !( (longAmount_ > shortAmount_ && longPrice < shortPrice) 
            || (longAmount_ <= shortAmount_ && ( longAmount_ * longPrice <= shortAmount_ * shortPrice )));

    
            
    mathint debt_ = 0;
    
    //assume vault is in a valid state
    require collateral_ >= debt_ ;

    // valid state - need to prove this as in invariant also when the vault is not valid should hold
    require  (totalSupplyShortOtoken_ >=  poolShortOtokenBalance_ + shortAmount_) &&
             totalSupplyLongOtoken_  >=  poolLongOtokenBalance_  &&
             poolLongOtokenBalance_ >= longAmount_ &&
             poolAssetBalance_ >= collateral_ ;

    // assume changes are coherent based on total required rules
    require collateral_ - _collateral ==  poolAssetBalance_-  _poolAssetBalance;
    require longAmount_ - _longAmount == poolLongOtokenBalance_ -  _poolLongOtokenBalance;
    require shortAmount_ - _shortAmount ==  totalSupplyShortOtoken_ - _totalSupplyShortOtoken;

    //verify no bankruptchy 
    assert poolAssetBalance_ >= obligation_ ;
}


/** For put options before expiry (strong bound): 
  obligation(o) ≡  (o.totalSupply() - storedBalance(o)) 

  The debt computation is also different 
*/
rule callOptionsPreExpiry(
    address owner,
    uint256 vaultId,
    uint256 index,
    address asset,
    uint256 _shortAmount,
    uint256 _longAmount,
    uint256 _collateral,
    uint256 _poolAssetBalance,
    uint256 _poolShortOtokenBalance,
    uint256 _poolLongOtokenBalance,
    uint256 _totalSupplyShortOtoken,
    uint256 _totalSupplyLongOtoken,
    uint256 shortPrice,
    uint256 longPrice,
    uint256 shortAmount_,
    uint256 longAmount_,
    uint256 collateral_,
    uint256 poolAssetBalance_,
    uint256 poolShortOtokenBalance_,
    uint256 poolLongOtokenBalance_,
    uint256 totalSupplyShortOtoken_,
    uint256 totalSupplyLongOtoken_
) {
    links();
    env e;
    require shortOtoken == getVaultShortOtoken(owner, vaultId, index);
    require longOtoken == getVaultLongOtoken(owner, vaultId, index);
    require collateralToken == getVaultCollateralAsset(owner, vaultId, index);
    require asset == collateralToken;

    require _shortAmount == getVaultShortAmount(owner, vaultId, index);
    require _longAmount == getVaultLongAmount(owner, vaultId, index);
    require _collateral == getVaultCollateralAmount(owner, vaultId, index);
    require _poolAssetBalance == pool.getStoredBalance(asset);
    require _poolShortOtokenBalance == pool.getStoredBalance(shortOtoken);
    require _poolLongOtokenBalance == pool.getStoredBalance(longOtoken);
    require _totalSupplyShortOtoken == assetTotalSupply(shortOtoken);
    require _totalSupplyLongOtoken == assetTotalSupply(longOtoken);
    require shortPrice == shortOtoken.strikePrice();
    require longPrice == longOtoken.strikePrice();

   // assume before expiry
    require !isVaultExpired(e, owner, vaultId);

    // assume no bankruptcy
	mathint _obligation = (_totalSupplyShortOtoken - _poolShortOtokenBalance )
                                         +  (_totalSupplyLongOtoken -  _poolLongOtokenBalance )   ;
    require (_poolAssetBalance >= _obligation) ;

    // based on Mathematica proof:
    mathint _debt = 0;
    mathint temp = _shortAmount - _longAmount;
    if temp > 0 {
        _debt = temp;
    }
    /**
     *             (long strike - short strike) * short amount
     * calculate  ----------------------------------------------
     *                             long strike
     */

    mathint temp2 = (longPrice - shortPrice) * _shortAmount / longPrice;
    mathint _debt2;
    if temp2 > _debt {
        _debt2 = temp2;
    } else {
        _debt2 = _debt;
    }

    //assume vault is in a valid state
    require _collateral >= _debt2 ;

    ////assume valid state based on  valid balances rules
    require ( _totalSupplyShortOtoken >= _poolShortOtokenBalance + _shortAmount) &&
              _totalSupplyLongOtoken >=  _poolLongOtokenBalance &&
              _poolLongOtokenBalance >= _longAmount &&
              _poolAssetBalance >= _collateral;

	//compute excess collateral of other vaults.
	mathint _obligationWithoutThisVault = (_totalSupplyShortOtoken - _poolShortOtokenBalance - _shortAmount)
                                             +  (_totalSupplyLongOtoken -  _poolLongOtokenBalance +_longAmount )   ;

    require ( _poolAssetBalance - _collateral >= _obligationWithoutThisVault );


    // simulate many operations in one step

    uint256 newShortAmount;
    uint256 newLongAmount;
    uint256 newcollateralAmount;
    uint256 newTotalSupply;
    sinvoke havocVault(owner, vaultId, index, newShortAmount, newLongAmount, newcollateralAmount); 
    sinvoke pool.havocSystemBalance(longOtoken);
    sinvoke pool.havocSystemBalance(asset);
    sinvoke shortOtoken.havocTotalSupply(newTotalSupply);


    require shortAmount_ == getVaultShortAmount(owner, vaultId, index);
    require longAmount_ == getVaultLongAmount(owner, vaultId, index);
    require collateral_ == getVaultCollateralAmount(owner, vaultId, index);
    require poolAssetBalance_ == pool.getStoredBalance(asset);
    require poolShortOtokenBalance_ == pool.getStoredBalance(shortOtoken);
    require poolLongOtokenBalance_ == pool.getStoredBalance(longOtoken);
    require totalSupplyShortOtoken_ == assetTotalSupply(shortOtoken);
    require totalSupplyLongOtoken_ == assetTotalSupply(longOtoken);

    //assume vault is in a vaild state
    mathint obligation_ = (totalSupplyShortOtoken_ - poolShortOtokenBalance_ )
                                                 +  (totalSupplyLongOtoken_ -  poolLongOtokenBalance_ )  ;


    mathint debt_ = 0;
    mathint temp3 = shortAmount_ - longAmount_;
    if temp3 > 0 {
         debt_ = temp3;
    }
       /**
        *             (long strike - short strike) * short amount
        * calculate  ----------------------------------------------
        *                             long strike
        */

    mathint temp4 = (longPrice - shortPrice) * shortAmount_ / longPrice;
    mathint debt_2;
    if temp4 > debt_ {
      debt_2 = temp4;
    } else {
        debt_2 = debt_;
    }
    require ( collateral_ >= debt_2 );

    // valid state 
    require  (totalSupplyShortOtoken_ >=  poolShortOtokenBalance_ + shortAmount_) &&
        totalSupplyLongOtoken_  >=  poolLongOtokenBalance_  &&
        poolLongOtokenBalance_ >= longAmount_  &&
        poolAssetBalance_ >= collateral_ ;


    // assume changes are coherent based on total required rules
    require collateral_ - _collateral ==  poolAssetBalance_-  _poolAssetBalance;
    require longAmount_ - _longAmount == poolLongOtokenBalance_ -  _poolLongOtokenBalance;
    require shortAmount_ - _shortAmount ==  totalSupplyShortOtoken_ - _totalSupplyShortOtoken;
 
    //verify no bankruptchy 
    assert poolAssetBalance_ >= obligation_ ;
}



// trying the complicated put option all symbolic 
rule putOptionsPreExpiryCase3StartingWithAllCasesNoCode(
    address owner,
    uint256 vaultId,
    uint256 index,
    address asset,
    uint256 _shortAmount,
    uint256 _longAmount,
    uint256 _collateral,
    uint256 _poolAssetBalance,
    uint256 _poolShortOtokenBalance,
    uint256 _poolLongOtokenBalance,
    uint256 _totalSupplyShortOtoken,
    uint256 _totalSupplyLongOtoken,
    uint256 shortPrice,
    uint256 longPrice,
    uint256 shortAmount_,
    uint256 longAmount_,
    uint256 collateral_,
    uint256 poolAssetBalance_,
    uint256 poolShortOtokenBalance_,
    uint256 poolLongOtokenBalance_,
    uint256 totalSupplyShortOtoken_,
    uint256 totalSupplyLongOtoken_
) {
    links();
    env e;
    require asset == collateralToken;

    // assume no bankruptcy
	mathint _obligation = (_totalSupplyShortOtoken - _poolShortOtokenBalance ) * shortPrice
                                         +  (_totalSupplyLongOtoken -  _poolLongOtokenBalance ) * longPrice;
    require _poolAssetBalance >= _obligation ;

    // based on Mathematica proof:
    mathint _debt = 0;
    if( _longAmount <= _shortAmount && ( _longAmount * longPrice <= _shortAmount * shortPrice )) {
            _debt = _shortAmount * shortPrice  -  _longAmount *  longPrice ;
    } else if ( _longAmount > _shortAmount && longPrice < shortPrice) {
            _debt = _shortAmount * (shortPrice - longPrice) ;
    }
    //assume vault is in a valid state
    require _collateral >= _debt ;

     require shortPrice != longPrice; // <============= make sure this is a valid requirement ADD rule
    //assume valid state based on  valid balances rules
    require ( _totalSupplyShortOtoken >= _poolShortOtokenBalance + _shortAmount) &&
              _totalSupplyLongOtoken >= _poolLongOtokenBalance &&
              _poolLongOtokenBalance >= _longAmount &&
              _poolAssetBalance >= _collateral ;

	//compute excess collateral of other vaults
	mathint _obligationWithoutThisVault = (_totalSupplyShortOtoken - _poolShortOtokenBalance - _shortAmount) * shortPrice
                                             +  (_totalSupplyLongOtoken -  _poolLongOtokenBalance +_longAmount ) * longPrice  ;

    // assume excess collateral of other vaults is not cover by this vault's collateral
    require ( _poolAssetBalance - _collateral >= _obligationWithoutThisVault );

	
    //everything changed beside:
    // 1. total supply of long (it changes only when minting - adding as short) 
    require totalSupplyLongOtoken_ == _totalSupplyLongOtoken;
    // 2.  pool holding of short (it changes only when adding as long) 
    require poolShortOtokenBalance_  == _poolShortOtokenBalance;

    mathint obligation_ = (totalSupplyShortOtoken_ - poolShortOtokenBalance_ ) * shortPrice
                                                 +  (totalSupplyLongOtoken_ -  poolLongOtokenBalance_ ) * longPrice  ;


    //assume isValid vault case 3
    require !( (longAmount_ > shortAmount_ && longPrice < shortPrice) 
            || (longAmount_ <= shortAmount_ && ( longAmount_ * longPrice <= shortAmount_ * shortPrice )));

    
            
    mathint debt_ = 0;
    
    //assume vault is in a valid state
    require collateral_ >= debt_ ;

    // valid state - need to prove this as in invariant also when the vault is not valid should hold
    require  (totalSupplyShortOtoken_ >=  poolShortOtokenBalance_ + shortAmount_) &&
             totalSupplyLongOtoken_  >=  poolLongOtokenBalance_  &&
             poolLongOtokenBalance_ >= longAmount_ &&
             poolAssetBalance_ >= collateral_ ;

    // assume changes are coherent based on total required rules
    require collateral_ - _collateral ==  poolAssetBalance_-  _poolAssetBalance;
    require longAmount_ - _longAmount == poolLongOtokenBalance_ -  _poolLongOtokenBalance;
    require shortAmount_ - _shortAmount ==  totalSupplyShortOtoken_ - _totalSupplyShortOtoken;

    //verify no bankruptchy 
    assert poolAssetBalance_ >= obligation_ ;
}

function links() {
    require anOtokenA() == shortOtoken;
    require anOtokenB() == longOtoken;
    require dummyERC20C() == collateralToken;
}