methods {
    testAdd (uint256, uint256) returns uint256 envfree
    testSub (uint256, uint256) returns uint256 envfree
    testFPI (uint256) returns uint256 envfree
}

definition MAXINT() returns uint256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

rule testFPI(uint256 a)
description "test fpi" 
{
    uint256 c = sinvoke testFPI(a);
    assert a == c, "failed conversion test";
}

rule testAdditionByZero(uint256 a)
description "test addition" 
{
    uint256 c = sinvoke testAdd(a, 0);

    assert c == a, "failed addition by zero test";
}

rule testAddition(uint256 a, uint256 b)
description "test addition" 
{
    uint256 c = sinvoke testAdd(a, b);

    assert a + b == c, "failed addition test";
}

rule testSubtraction(uint256 a, uint256 b)
description "test subtraction" 
{
    require a >= b;
    uint256 c = sinvoke testSub(a, b);

    assert a - b == c, "failed subtraction test";
}