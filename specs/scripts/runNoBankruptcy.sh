certoraRun specs/harness/ControllerHarnessExtra.sol specs/harness/MarginPoolHarness.sol specs/harness/OtokenHarnessA.sol specs/harness/OtokenHarnessB.sol specs/harness/DummyERC20A.sol specs/harness/DummyERC20B.sol specs/harness/DummyERC20C.sol --link  ControllerHarnessExtra:pool=MarginPoolHarness ControllerHarnessExtra:anOtokenA=OtokenHarnessA ControllerHarnessExtra:anOtokenB=OtokenHarnessB ControllerHarnessExtra:dummyERC20C=DummyERC20C OtokenHarnessA:underlyingAsset=DummyERC20A OtokenHarnessA:strikeAsset=DummyERC20B OtokenHarnessA:collateralAsset=DummyERC20C OtokenHarnessB:underlyingAsset=DummyERC20A OtokenHarnessB:strikeAsset=DummyERC20B OtokenHarnessB:collateralAsset=DummyERC20C --verify ControllerHarnessExtra:specs/NoBankruptcy.spec  --solc solc --settings -assumeUnwindCond,-b=3,-ciMode=true,-useNonLinearArithmetic,-rule=$1 --cache OpynNoBankruptcy 
