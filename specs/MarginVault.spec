
methods {
	//core functions wrappers
	addShort(address, uint256, uint256) envfree
	removeShort(address, uint256, uint256) envfree
	addLong(address, uint256, uint256) envfree
	removeLong(address, uint256, uint256) envfree
	addCollateral(address, uint256, uint256) envfree
	removeCollateral(address, uint256, uint256) envfree
	//getters for collateral
	totalCollateral() returns uint256 envfree
	collateralAmountLength() returns uint256 envfree
	collateralAssetsLength() returns uint256 envfree
	getCollateralAmount(uint256) returns uint256 envfree
	getCollateralAsset(uint256) returns address envfree
	//getters for shorts
	totalShortAmount() returns uint256 envfree
	shortAmountLength() returns uint256 envfree
	shortOtokensLength() returns uint256 envfree
	getShortOtoken(uint256) returns address envfree
	getShortAmount(uint256) returns uint256 envfree
	//getters for longs
	totalLongAmount() returns uint256 envfree
	longAmountLength() returns uint256 envfree
	longOtokensLength() returns uint256 envfree
	getLongOtoken(uint256) returns address envfree
	getLongAmount(uint256) returns uint256 envfree
}

definition MAXINT() returns uint256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
definition ADDRESSZERO() returns address = 0;

/**
@title Valid state of a vault
@notice A vault v  is in a valid state if for each of the entities (collateral, long, short):
(i) The length of the list of amounts of entity equals to the length of the list of addresses of this entity
(ii) The entity amount at index i is greater than zero iff there is a non zero address at index i of this entity
*/
invariant validVault() 	longAmountLength() == longOtokensLength() &&  
						shortAmountLength() == shortOtokensLength() &&
						collateralAmountLength() == collateralAssetsLength() 
						
invariant validEntityIndex(uint256 index)
						(getLongAmount(index) > 0 <=> getLongOtoken(index) != 0) &&
						(getShortAmount(index) > 0 <=> getShortOtoken(index) != 0) &&
						(getCollateralAmount(index) > 0 <=> getCollateralAsset(index) != 0)
{
	preserved addLong(address asset, uint256 amt, uint256 _index)
	{
		requireInvariant validEntityIndex(_index);
		requireInvariant validEntityIndex(index);
		require asset != ADDRESSZERO();
	}
	preserved addShort(address asset, uint256 amt, uint256 _index)
	{
		requireInvariant validEntityIndex(_index);
		requireInvariant validEntityIndex(index);
		require asset != ADDRESSZERO();
	}
	preserved addCollateral(address asset, uint256 amt, uint256 _index)
	{
		requireInvariant validEntityIndex(_index);
		requireInvariant validEntityIndex(index);
		require asset != ADDRESSZERO();
	}
}

/***
@title Change to one entity 
@notice Each operation changes at most one entity: short, long or collateral
This is a parametic rule where f is any of the external/public functions of the contract
*/
rule changeToOneEntity(uint256 shortIndex, uint256 longIndex, uint256 collateralIndex, method f ) {
	
	requireInvariant validVault();
	uint256 longAmountBefore = getLongAmount(longIndex);
	uint256 shortAmountBefore = getShortAmount(shortIndex);
	uint256 collateralAmountBefore = getCollateralAmount(collateralIndex);
	calldataarg args;
	env e;
	sinvoke f(e,args);
	uint256 longAmountAfter = getLongAmount(longIndex);
	uint256 shortAmountAfter = getShortAmount(shortIndex);
	uint256 collateralAmountAfter = getCollateralAmount(collateralIndex);

	assert (longAmountBefore != longAmountAfter => (shortAmountBefore == shortAmountAfter && collateralAmountBefore == collateralAmountAfter)) &&
		   (shortAmountBefore != shortAmountAfter  => (longAmountBefore == longAmountAfter && collateralAmountBefore == collateralAmountAfter)) &&
		   (collateralAmountBefore != collateralAmountAfter  => (longAmountBefore == longAmountAfter && shortAmountBefore == shortAmountAfter)); 
}
	

/**
@title Success characteristic of addCollateral 
@notice One should be able to add collateral on a valid vault v under realistic circumstances
		{ x > 0 ∧
		    ( i < v.collateralAmounts.length ⇒  ( v.collateralAssets[i] = a ∧ v.collateralAmounts[i] + x < MAX_UINT) ) }
           r = addCollateral(v,a,x,i)
        { r }

*/
rule successOfAddCollateral(address asset, uint256 x, uint256 index)
{
	requireInvariant validVault();
	require asset != ADDRESSZERO();
	require x > 0;
	require index < MAXINT();
	// require index <= collateralAmountLength();
	if (index < collateralAmountLength()) {
		require asset == getCollateralAsset(index);
		require getCollateralAmount(index) + x < MAXINT();

		invoke addCollateral(asset, x, index);
		assert !lastReverted, "addCollateral may revert when precondition holds";
	}
	else if ((index == collateralAmountLength())) {
		invoke addCollateral(asset, x, index);
		assert !lastReverted, "addCollateral may revert when precondition holds";
	}
	else {
		invoke addCollateral(asset, x, index);
		assert lastReverted, "addCollateral may not revert when precondition not holds";
	}
}


/**
@title Integrity of addCollateral 
@notice When successfully adding x collateral to a vault, the totalCollateral increases by x. 
	{ b = totalCollateral(v) }
		addCollateral(v,a,x);
	{ totalCollateral(v) = b + x }
*/
rule integrityOfAddCollateral(address asset, uint256 x, uint256 index)
{
	requireInvariant validVault();
	require asset != ADDRESSZERO();
	uint256 collateralBefore = totalCollateral();
	sinvoke addCollateral(asset, x, index);
	assert totalCollateral() == collateralBefore + x, "integirty break of addCollateral";
}

/**
@title Additive addCollateral 
@notice Adding collateral to a vault is additive, i.e., it can be performed either all at once or in steps.	
		addCollateral(v,a,x);addCollateral(v,a,y) ~ addCollateral(v,a,x+y) 
	{ totalCollateral1(v) = totalCollateral2(v) }
*/
rule additiveAddCollateral(address asset, uint256 x, uint256 y, uint256 index)
{
		requireInvariant validVault();
		require asset != ADDRESSZERO();
    	require index < MAXINT(); // no violation when limiting index
    	require x > 0 && y > 0 ;
    	uint256 t = x + y ;
        require( t >= x && t >= y); //no overflow
        storage initialStorage = lastStorage;
    	invoke addCollateral(asset, x, index);
    	bool call1 = !lastReverted;
    	invoke addCollateral(asset, y, index);
    	bool call2 = !lastReverted;
    	uint256 collateralAmountScenario1 = totalCollateral();
    	invoke addCollateral(asset, t, index) at initialStorage;
    	bool call3 = !lastReverted;
    	uint256 collateralAmountScenario2 = totalCollateral();
    	assert (call1 && call2) <=> call3, "addCollateral is not additive, one scenario reverts" ;
    	assert call3 => collateralAmountScenario1 == collateralAmountScenario2, "addCollateral is not additive" ;
}

/**
@title Inverse addCollateral and removeCollateral
@notice Adding and removing collateral are inverse operations 
	{ b = totalCollateral(v) }
		addCollateral(v,a,x);removeCollateral(x,a,x)
	{ totalCollateral(v) = b }
*/
rule inverseAddRemoveCollateral(address asset, uint256 x, uint256 index) 
{
	requireInvariant validVault();
	uint256 collateralBefore = totalCollateral();
	sinvoke addCollateral(asset, x, index);
	invoke removeCollateral(asset, x, index);
	assert !lastReverted && totalCollateral() == collateralBefore, "removeCollateral is not inverse of addCollateral"; 
}

/**
@title Integrity of addShort 
*/
rule integrityOfAddShort(address shortOtoken, uint256 x, uint256 index)
{
	requireInvariant validVault();
	require shortOtoken != ADDRESSZERO();
	uint256 shortAmountBefore = totalShortAmount();
	sinvoke addShort(shortOtoken, x, index);
	assert  totalShortAmount() == shortAmountBefore + x &&
		    getShortOtoken(index) == shortOtoken, "integrity break of addShort";
}

/**
@title Additive addShort 
*/
rule additiveAddShort(address shortOtoken, uint256 x, uint256 y, uint256 index)
{
	requireInvariant validVault();
	require shortOtoken != ADDRESSZERO();
	require index < MAXINT(); // no violation when limiting index
	require x > 0 && y > 0 ;
	uint256 t = x + y ;
    require( t >= x && t >= y); //no overflow
    storage initialStorage = lastStorage;
	invoke addShort(shortOtoken, x, index);
	bool call1 = !lastReverted;
	invoke addShort(shortOtoken, y, index);
	bool call2 = !lastReverted;
	uint256 shortAmountScenario1 = totalShortAmount();
	invoke addShort(shortOtoken, t, index) at initialStorage;
	bool call3 = !lastReverted;
	uint256 shortAmountScenario2 = totalShortAmount();
	assert (call1 && call2) <=> call3, "addShort is not additive, one scenario reverts" ;
	assert call3 => shortAmountScenario1 == shortAmountScenario2, "addShort is not additive" ;
}

/**
@title Inverse addShort and removeShort
*/
rule inverseAddRemoveShort(address shortOtoken, uint256 x, uint256 index) 
{
	requireInvariant validVault();
	uint256 shortAmountBefore = totalShortAmount();
	sinvoke addShort(shortOtoken, x, index);
	invoke removeShort(shortOtoken, x, index);
	assert !lastReverted && totalShortAmount() == shortAmountBefore, "removeShort is not inverse of addShort"; 
}


/**
@title Integrity of addLong 
*/
rule integrityOfAddLong(address longOtoken, uint256 x, uint256 index)
{
	requireInvariant validVault();
	require longOtoken != ADDRESSZERO();
	uint256 longAmountBefore = totalLongAmount();
	sinvoke addLong(longOtoken, x, index);
	assert totalLongAmount() == longAmountBefore + x &&
		getLongOtoken(index) == longOtoken, "integirty break of addLong";
}

/**
@title Additive addLong 
*/
rule additiveAddLong(address longOtoken, uint256 x, uint256 y, uint256 index)
{
	requireInvariant validVault();
	require longOtoken != ADDRESSZERO();
	require index < MAXINT(); // no violation when limiting index
	require x > 0 && y > 0 ;
	uint256 t = x + y ;
    require( t >= x && t >= y); //no overflow
    storage initialStorage = lastStorage;
	invoke addLong(longOtoken, x, index);
	bool call1 = !lastReverted;
	invoke addLong(longOtoken, y, index);
	bool call2 = !lastReverted;
	uint256 longAmountScenario1 = totalLongAmount();
	invoke addLong(longOtoken, t, index) at initialStorage;
	bool call3 = !lastReverted;
	uint256 longAmountScenario2 = totalLongAmount();
	assert (call1 && call2) <=> call3, "addLong is not additive, one scenario reverts" ;
	assert call3 => longAmountScenario1 == longAmountScenario2, "addLong is not additive" ;
}

/**
@title Inverse addLong and removeLong
*/
rule inverseAddRemoveLong(address longOtoken, uint256 x, uint256 index) 
{
	requireInvariant validVault();
	uint256 longAmountBefore = totalLongAmount();
	sinvoke addLong(longOtoken, x, index);
	invoke removeLong(longOtoken, x, index);
	assert !lastReverted && totalLongAmount() == longAmountBefore, "removeLong is not inverse of addLong"; 
}

