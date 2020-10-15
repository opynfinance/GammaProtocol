methods {
    testAdd (uint256, uint256) returns uint256 envfree
}



rule testAddition(uint256 a, uint256 b)
description "test addition" 
{
    uint256 c = a + b;
    uint256 cScaled = sinvoke testAdd(a, b);
    assert c * (10^18) == cScaled, "failed addition test";
}