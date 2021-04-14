methods {
    getCollateralDust(address) returns uint256 envfree
    // getProductTimeToExpiry(address, address, address, bool) returns uint256[] envfree
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


// /***
// @title Checks that the dust set for a collateral > 0 
// @notice 
// */
// rule expiryTimesInAscendingOrder (address underlying, address strike, address collateral, bool isPut) {
//     uint256[] expiryTimestamps = getProductTimeToExpiry(underlying, strike, collateral, isPut);
// }