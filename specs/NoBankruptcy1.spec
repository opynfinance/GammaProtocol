using OtokenHarnessA as shortOtoken
using OtokenHarnessB as longOtoken
using DummyERC20C as collateralToken
using MarginPoolHarness as pool
using MarginCalculator as calculator

methods {
    //The tracked asset balance of the system
    pool.getStoredBalance(address) returns uint256 envfree
    //The asset balance of MarginPool. i.e.,  asset.balanceOf(MarginPool)
    assetBalanceOfPool(address) returns uint256 envfree
    //The asset (first param) balance of account (second param)
    assetBalanceOf(address, address) returns uint256 envfree
    // the total supply of an asset. i.e., asset.totalSupply()
    assetTotalSupply(address) returns uint256 envfree
    //the amount of collateral in an index in a vault of an owner. i.e.,  vaults[owner][index].collateralAmounts[i]
    getVaultCollateralAmount(address, uint256, uint256)  returns uint256 envfree
    //the collateral asset of an index in a vault of an owner. i.e., vaults[owner][index].collateralAssets(i)
    getVaultCollateralAsset(address, uint256, uint256)  returns address envfree
    //the amount of long in an index in a vault of an owner. i.e.,  vaults[owner][index].longAmounts[i]
    getVaultLongAmount(address, uint256, uint256)  returns address envfree
    //the long oToken in an index in a vault of an owner. i.e.,  vaults[owner][index].longOtoken[i]
    getVaultLongOtoken(address, uint256, uint256)  returns uint256 envfree
    //the amount of long in an index in a vault of an owner. i.e.,  vaults[owner][index].shortAmounts[i]
    getVaultShortAmount(address, uint256, uint256)  returns address envfree
    //the long oToken in an index in a vault of an owner. i.e.,  vaults[owner][index].shortOtoken[i]
    getVaultShortOtoken(address, uint256, uint256)  returns uint256 envfree
    //Is first address authorized the second one to manipulate his vaults
    isAuthorized(address, address) returns bool envfree
    //number of vaults one owns
    getAccountVaultCounter(address) returns uint256 envfree

    shortOtoken.strikePrice() returns uint256 envfree
    shortOtoken.expiryTimestamp() returns uint256 envfree
    shortOtoken.havocTotalSupply(uint256) envfree
    longOtoken.strikePrice() returns uint256 envfree
    longOtoken.expiryTimestamp() returns uint256 envfree
    longOtoken.havocTotalSupply(uint256) envfree

    owner() returns address envfree
    dummyERC20C() returns address envfree
    isValidAsset(address) returns bool envfree
    isValidVault(address, uint256) returns bool
    getPutMarginRequiredNonExpired(address, uint256) returns int256
    collateralToken.decimals() returns uint256 envfree
    pool.havocSystemBalance(address) envfree
}


////// VERSION 1: Assuming one case in Put

rule tying_it_all_together1(
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
    require shortOtoken == getVaultShortOtoken(owner, 0, 0);
    require longOtoken == getVaultLongOtoken(owner, 0, 0);
    require collateralToken == getVaultCollateralAsset(owner, 0, 0);
    require asset == collateralToken;

    require _shortAmount == getVaultShortAmount(owner, 0, 0);
    require _longAmount == getVaultLongAmount(owner, 0, 0);
    require _collateral == getVaultCollateralAmount(owner,0,0 );
    require _poolAssetBalance == pool.getStoredBalance(asset);
    require _poolShortOtokenBalance == pool.getStoredBalance(shortOtoken);
    require _poolLongOtokenBalance == pool.getStoredBalance(longOtoken);
    require _totalSupplyShortOtoken == assetTotalSupply(shortOtoken);
    require _totalSupplyLongOtoken == assetTotalSupply(longOtoken);
    require shortPrice == shortOtoken.strikePrice();
    require longPrice == longOtoken.strikePrice();

    // assume no bankruptcy
	mathint obligation = (_totalSupplyShortOtoken - _poolShortOtokenBalance ) * shortPrice
                                         +  (_totalSupplyLongOtoken -  _poolLongOtokenBalance ) * longPrice  ;
    require (_poolAssetBalance >= obligation) ;
    // based on Lior
    require( _longAmount <= _shortAmount && _longAmount * longPrice <=  _shortAmount * shortPrice );
	mathint debt = _shortAmount * shortPrice  -  _longAmount *  longPrice ;
    require (_collateral >= debt );
	

    //assume valid state
    require ( (_totalSupplyShortOtoken >=  _poolShortOtokenBalance + _shortAmount) &&
              _totalSupplyLongOtoken >=  _poolLongOtokenBalance &&
              _poolLongOtokenBalance >= _longAmount &&
              _poolAssetBalance >= _collateral);
    
	//assume only one vault
	require ( _shortAmount == _totalSupplyShortOtoken && _longAmount == _poolLongOtokenBalance &&  _poolLongOtokenBalance == _totalSupplyLongOtoken);
	require( _collateral - debt == _poolAssetBalance - obligation);
    uint256 newShortAmount;
    uint256 newLongAmount;
    uint256 newcollateralAmount;
    uint256 newTotalSupply;
    env e;
    havocVault(e, owner, 0, 0, newShortAmount, newLongAmount, newcollateralAmount); // simulate many operations in one step
    sinvoke pool.havocSystemBalance(longOtoken);
    sinvoke pool.havocSystemBalance(asset);
    sinvoke shortOtoken.havocTotalSupply(newTotalSupply);


    require shortAmount_ == getVaultShortAmount(owner, 0, 0);
    require longAmount_ == getVaultLongAmount(owner, 0, 0);
    require collateral_ == getVaultCollateralAmount(owner ,0,0 );
    require poolAssetBalance_ == pool.getStoredBalance(asset);
    require poolShortOtokenBalance_ == pool.getStoredBalance(shortOtoken);
    require poolLongOtokenBalance_ == pool.getStoredBalance(longOtoken);
    require totalSupplyShortOtoken_ == assetTotalSupply(shortOtoken);
    require totalSupplyLongOtoken_ == assetTotalSupply(longOtoken);

    //assume isValid vault option 1
    require ( collateral_ >= shortAmount_ * shortPrice  -  longAmount_ *  longPrice );
    require( longAmount_ < shortAmount_ && longAmount_ * longPrice <  shortAmount_ * shortPrice  );

    // valid state - need to prove this as in invariant also when the vault is not valid should hold
   require ( (totalSupplyShortOtoken_ >=  poolShortOtokenBalance_ + shortAmount_) &&
             totalSupplyLongOtoken_  >=  poolLongOtokenBalance_  &&
             poolLongOtokenBalance_ >= longAmount_ &&
             poolAssetBalance_ >= collateral_ );

	//assume only one vault
	require ( shortAmount_ == totalSupplyShortOtoken_ && longAmount_ == poolLongOtokenBalance_ && poolLongOtokenBalance_ == totalSupplyLongOtoken_);

    // based on total required rules
    require ( collateral_ - _collateral ==  poolAssetBalance_-  _poolAssetBalance);
    require ( longAmount_ - _longAmount == poolLongOtokenBalance_ -  _poolLongOtokenBalance);
    require ( shortAmount_ - _shortAmount ==  totalSupplyShortOtoken_ - _totalSupplyShortOtoken );

   assert ( poolAssetBalance_ >= (totalSupplyShortOtoken_ -  poolShortOtokenBalance_ ) * shortPrice
                                            +  (totalSupplyLongOtoken_ -  poolLongOtokenBalance_ ) * longPrice  ) ;

}
