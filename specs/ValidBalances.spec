using DummyERC20C as collateralToken
using MarginPool as pool

methods {
    //The tracked asset balance of the system
    pool.getStoredBalance(address) returns uint256 envfree
    
    // ERC20 functions
    collateralToken.totalSupply() returns uint256 envfree
    collateralToken.balanceOf(address) returns uint256 envfree
  
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
	// checks if the vault is expired (true when there is an otoken which we can check expiry for)
    isVaultExpired(address, uint256) returns bool
    // checks if vault is "small" all lengths shorter than a constant
    smallVault(address, uint256, uint256) returns bool envfree
}

summaries {
    expiryTimestamp() => CONSTANT;
}

/**
@title Valid balance with respect to total collateral
@notice The sum of a collateral asset across vaults matches the assetBalance stored in the margin pool
        Vasset = { (v,i) v ∈ Vaults.  v.collateralAssets(i) = asset }
        getStoredBalance(asset) = ∑(v,i) ∈ Vasset. v.collateralAmounts[i]

This is proven by showing that change to a single vault is coherent with the change to the stored balance

*/
rule validBalanceTotalCollateral(address owner, uint256 vaultId, uint256 index, address asset, method f)
description "$f breaks the validity of stored balance of collateral asset"
{
    env e;
    require asset == collateralToken;
    require getVaultCollateralAsset(owner, vaultId, index) == asset;
    require !isVaultExpired(e, owner, vaultId);
    uint256 collateralVaultBefore = getVaultCollateralAmount(owner, vaultId, index);
    uint256 poolBalanceBefore = pool.getStoredBalance(asset);
    if (f.selector == settleVault(address,uint256,address).selector) {
        assert true;
	} else if (f.selector == withdrawCollateral(address,uint256,address,uint256,uint256).selector) {
	    // have to require array lengths <= small const here
	    require smallVault(owner, vaultId, 1);
		address whoever;
		uint256 whatever;
		sinvoke withdrawCollateral(e, owner, vaultId, whoever, index, whatever);
    } else {
		calldataarg arg;
        sinvoke f(e, arg);
    }
    uint256 collateralVaultAfter = getVaultCollateralAmount(owner, vaultId, index);
    uint256 poolBalanceAfter = pool.getStoredBalance(asset);
    assert collateralVaultBefore != collateralVaultAfter => (poolBalanceAfter - poolBalanceBefore ==  collateralVaultAfter - collateralVaultBefore);
}


/**
@title Valid balance of long oTokens
@notice The sum of a long asset across vaults matches the assetBalance stored in the margin pool
        Vasset = { (v,i) v ∈ Vaults.  v.longOtokens(i) = oToken}
        getStoredBalance(oToken) = ∑(v,i) ∈ Vasset. v.longAmounts[i]
*/
rule validBalanceTotalLong(address owner, uint256 vaultId, uint256 index, address oToken, method f)
description "$f breaks the validity of stored balance of long asset"
{
    env e;
    require oToken == collateralToken;
    require !isVaultExpired(e, owner, vaultId);
    require getVaultLongOtoken(owner, vaultId, index) == oToken;
    uint256 longVaultBefore = getVaultLongAmount(owner, vaultId, index);
    uint256 poolBalanceBefore = pool.getStoredBalance(oToken);
    if (f.selector == settleVault(address,uint256,address).selector) {
        assert true;
    } else {
        calldataarg arg;
        sinvoke f(e, arg);
    }
    uint256 longVaultAfter = getVaultLongAmount(owner, vaultId, index);
    uint256 poolBalanceAfter = pool.getStoredBalance(oToken);
    assert longVaultBefore != longVaultAfter => ( poolBalanceAfter - poolBalanceBefore ==  longVaultAfter - longVaultBefore);
}


/**
@title Valid supply of short oToken
@notice The sum of a short asset across vaults matches the supply of that short oToken
        Vasset = { (v,i) v ∈ Vaults.  v.shortOtokens(i) = oToken}
        oToken.totalSupply() = ∑(v,i) ∈ Vasset. v.shortAmounts[i]
*/
rule validBalanceTotalShort(address owner, uint256 vaultId, uint256 index, address oToken, method f)
description "$f breaks the validity of stored balance of short asset"
{
    env e;
    calldataarg arg;
    require oToken == collateralToken;
    require !isVaultExpired(e, owner, vaultId);
    require getVaultShortOtoken(owner, vaultId, index) == oToken;
    uint256 shortVaultBefore = getVaultShortAmount(owner, vaultId, index);
    uint256 supplyBefore = collateralToken.totalSupply();
    if (f.selector == settleVault(address,uint256,address).selector) {
        assert true;
    } else {
        calldataarg arg;
        sinvoke f(e, arg);
    }
    uint256 shortVaultAfter = getVaultShortAmount(owner, vaultId, index);
    uint256 supplyAfter = collateralToken.totalSupply();
    assert shortVaultBefore != shortVaultAfter => (supplyAfter - supplyBefore ==  shortVaultAfter - shortVaultBefore);
}

rule cantSettleUnexpiredVault(address owner, uint256 vaultId)
{
    env e;
    require !isVaultExpired(e, owner, vaultId);
    require smallVault(owner, vaultId, 1);
    address whoever;
    sinvoke settleVault(e, owner, vaultId, whoever);
    assert false; // will pass because cannot sinvoke settleVault when dealing with a non-expired vault
}


/**
@title Valid balance of the system
@notice The balance of the system at an external asset is correlated with the tracked  asset balance
        getStoredBalance(asset) ≤ asset.balanceOf(MarginPool)
*/
// XX Instantiated for collateral token
/*isValidAsset(asset) => */
invariant validBalanceOfTheSystem
         sinvoke pool.getStoredBalance(collateralToken) <= sinvoke collateralToken.balanceOf(pool)
