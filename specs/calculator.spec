methods {
    getCollateralDust(address) returns uint256 envfree
    getProductTimeToExpiry(address, address, address, bool, uint256) returns uint256 envfree
    getProductTimeToExpirySize(address, address, address, bool) returns uint256 envfree
}

/***
@title Checks that the dust set for a collateral > 0 
@notice 
*/
rule validDust(address collateral, uint256 dust) {
    env e;
    setCollateralDust(e, collateral, dust);
    uint256 dustSet = getCollateralDust(collateral);
    assert dustSet > 0; 
}

/***
@title Checks that the dust set for a collateral > 0 
@notice 
*/
rule expiryTimesInAscendingOrder (address underlying, address strike, address collateral, bool isPut, uint256 timeToExpiry) {
    env e;

    uint256 size = getProductTimeToExpirySize(underlying, strike, collateral, isPut);
    uint256 index0 = size - 1;
    uint256 index1 = size;

    sinvoke setProductTimeToExpiry(e, underlying, strike, collateral, isPut, timeToExpiry);

    uint256 expiryTimestamp0 = getProductTimeToExpiry(underlying, strike, collateral, isPut, index0);
    uint256 expiryTimestamp1 = getProductTimeToExpiry(underlying, strike, collateral, isPut, index1);

    assert expiryTimestamp0 <= expiryTimestamp1;
}