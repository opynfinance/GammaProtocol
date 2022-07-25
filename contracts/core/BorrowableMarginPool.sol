/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;

import {ERC20Interface} from "../interfaces/ERC20Interface.sol";
import {OtokenInterface} from "../interfaces/OtokenInterface.sol";
import {AddressBookInterface} from "../interfaces/AddressBookInterface.sol";
import {WhitelistInterface} from "../interfaces/WhitelistInterface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";
import {SafeERC20} from "../packages/oz/SafeERC20.sol";
import {MarginPool} from "./MarginPool.sol";

/**
 * @author Ribbon Team
 * @title MarginPoolV2
 * @notice Contract that holds all protocol funds AND allows collateral borrows
 */
contract BorrowableMarginPool is MarginPool {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Interface;

    uint16 public constant TOTAL_PCT = 10000; // Equals 100%

    /// @dev mapping between collateral asset and borrow PCT
    mapping(address => uint256) public borrowPCT;
    /// @dev mapping between address and whitelist status of borrower
    mapping(address => bool) internal whitelistedBorrower;
    /// @dev mapping between address and whitelist status of otoken buyer
    /// This is the whitelist for all the holders of oTokens that have a claim to
    /// collateral in this pool
    mapping(address => bool) internal whitelistedOTokenBuyer;
    /// @dev mapping between address and whitelist status of options vault
    /// This denotes whether an options vault can create a margin vault with
    /// collateral custodied in this borrowable vault
    mapping(address => bool) internal whitelistedOptionsVault;
    /// @dev mapping between (borrower, asset) and outstanding borrower amount
    mapping(address => mapping(address => uint256)) public borrowed;

    /**
     * @notice contructor
     * @param _addressBook AddressBook module
     */
    constructor(address _addressBook) public MarginPool(_addressBook) {}

    /// @notice emit event when a borrower is whitelisted / blacklisted
    event SetBorrowWhitelist(address indexed borrower, bool whitelisted);
    /// @notice emit event when a oToken buyer is whitelisted / blacklisted
    event SetOTokenBuyerWhitelist(address indexed oTokenBuyer, bool whitelisted);
    /// @notice emit event when a options vault is whitelisted / blacklisted
    event SetOptionsVaultWhitelist(address indexed optionsVault, bool whitelisted);
    /// @notice emit event when borrowing percent has been changed
    event SetBorrowPCT(address indexed collateralAsset, uint256 borrowPCT);
    /// @notice emit event when a borrower borrows an asset
    event Borrow(address indexed oToken, address indexed collateralAsset, uint256 amount, address indexed borrower);
    /// @notice emit event when a loan is repaid
    event Repay(
        address indexed oToken,
        address indexed collateralAsset,
        uint256 amount,
        address indexed borrower,
        address repayer
    );

    /**
     * @notice check if the sender is whitelisted
     */
    modifier onlyWhitelistedBorrower() {
        require(whitelistedBorrower[msg.sender], "MarginPool: Sender is not whitelisted borrower");

        _;
    }

    /**
     * @notice check if a borrower is whitelisted
     * @param _borrower address of the borrower
     * @return boolean, True if the borrower is whitelisted
     */
    function isWhitelistedBorrower(address _borrower) external view returns (bool) {
        return whitelistedBorrower[_borrower];
    }

    /**
     * @notice check if a oToken buyer is whitelisted
     * @param _oTokenBuyer address of the oToken buyer
     * @return boolean, True if the oToken buyer is whitelisted
     */
    function isWhitelistedOTokenBuyer(address _oTokenBuyer) external view returns (bool) {
        return whitelistedOTokenBuyer[_oTokenBuyer];
    }

    /**
     * @notice check if a options vault is whitelisted
     * @param _optionsVault address of the options vault
     * @return boolean, True if the options vault is whitelisted
     */
    function isWhitelistedOptionsVault(address _optionsVault) external view returns (bool) {
        return whitelistedOptionsVault[_optionsVault];
    }

    /**
     * @notice Set borrower whitelist status
     * @param _borrower address of the borrower (100% of the time verified market makers)
     * @param _whitelisted bool of whether it is whitelisted or blacklisted
     */
    function setBorrowerWhitelistedStatus(address _borrower, bool _whitelisted) external onlyOwner {
        require(_borrower != address(0), "!_borrower");

        whitelistedBorrower[_borrower] = _whitelisted;
        emit SetBorrowWhitelist(_borrower, _whitelisted);
    }

    /**
     * @notice Set options vault whitelist status
     * @param _optionsVault address of the options vault
     * @param _whitelisted bool of whether it is whitelisted or blacklisted
     */
    function setOptionsVaultWhitelistedStatus(address _optionsVault, bool _whitelisted) external onlyOwner {
        require(_optionsVault != address(0), "!_optionsVault");

        whitelistedOptionsVault[_optionsVault] = _whitelisted;
        emit SetOptionsVaultWhitelist(_optionsVault, _whitelisted);
    }

    /**
     * @notice Set oToken buyer whitelist status
     * @param _oTokenBuyer address of the oToken buyer
     * @param _whitelisted bool of whether it is whitelisted or blacklisted
     */
    function setOTokenBuyerWhitelistedStatus(address _oTokenBuyer, bool _whitelisted) external onlyOwner {
        require(_oTokenBuyer != address(0), "!_buyer");

        whitelistedOTokenBuyer[_oTokenBuyer] = _whitelisted;
        emit SetOTokenBuyerWhitelist(_oTokenBuyer, _whitelisted);
    }

    /**
     * @notice Set Borrow percent of collateral asset
     * @param _collateral address of collateral asset
     * @param _borrowPCT borrow PCT
     */
    function setBorrowPCT(address _collateral, uint256 _borrowPCT) external onlyOwner {
        borrowPCT[_collateral] = _borrowPCT;
        emit SetBorrowPCT(_collateral, _borrowPCT);
    }

    /**
     * @notice Lends out asset to market maker
     * @param _oToken address of the oToken laying claim to the collateral assets
     * @param _amount amount of the asset to lend to borrower
     */
    function borrow(address _oToken, uint256 _amount) public onlyWhitelistedBorrower {
        require(
            WhitelistInterface(AddressBookInterface(addressBook).getWhitelist()).isWhitelistedOtoken(_oToken),
            "MarginPool: oToken is not whitelisted"
        );

        require(_amount > 0, "MarginPool: Cannot borrow 0 of underlying");

        OtokenInterface oToken = OtokenInterface(_oToken);

        address collateralAsset = oToken.collateralAsset();
        uint256 outstandingAssetBorrow = borrowed[msg.sender][collateralAsset];

        require(!oToken.isPut(), "MarginPool: oToken is not a call option");

        // Make sure borrow does not attempt to borrow with an expired oToken
        require(
            oToken.expiryTimestamp() > block.timestamp,
            "MarginPool: Cannot borrow collateral asset of expired oToken"
        );

        uint256 collateralAssetDecimals = ERC20Interface(collateralAsset).decimals();

        uint256 oTokenBalance = ERC20Interface(_oToken).balanceOf(msg.sender);

        // Each oToken represents 1:1 of collateral token
        // So a market maker can borrow at most our oToken balance in the collateral asset
        uint256 collateralAllocatedToMM = collateralAssetDecimals >= 8
            ? oTokenBalance.mul(10**(collateralAssetDecimals.sub(8)))
            : oTokenBalance.div(10**(uint256(8).sub(collateralAssetDecimals)));

        require(
            _amount <=
                collateralAllocatedToMM.mul(borrowPCT[collateralAsset]).div(TOTAL_PCT).sub(outstandingAssetBorrow),
            "MarginPool: Borrowing more than allocated"
        );

        borrowed[msg.sender][collateralAsset] = outstandingAssetBorrow.add(_amount);

        // transfer (oTokenBalance * _amount / collateralAllocatedToMM) of oToken from borrower to _pool
        ERC20Interface(_oToken).safeTransferFrom(
            msg.sender,
            address(this),
            oTokenBalance.mul(_amount).div(collateralAllocatedToMM)
        );
        // transfer _amount of collateralAsset from pool to borrower
        ERC20Interface(collateralAsset).safeTransfer(msg.sender, _amount);
        emit Borrow(_oToken, collateralAsset, _amount, msg.sender);
    }

    /**
     * @notice get the amount borrowable by market maker
     * @param _borrower address of the borrower
     * @param _oToken address of the oToken laying claim to the collateral assets
     */
    function borrowable(address _borrower, address _oToken) external view returns (uint256) {
        OtokenInterface oToken = OtokenInterface(_oToken);
        address collateralAsset = oToken.collateralAsset();

        uint256 collateralAssetDecimals = ERC20Interface(collateralAsset).decimals();

        uint256 collateralAllocatedToMM = ERC20Interface(_oToken).balanceOf(_borrower);
        if (collateralAssetDecimals >= 8) {
            collateralAllocatedToMM = collateralAllocatedToMM.mul(10**(collateralAssetDecimals.sub(8)));
        } else {
            collateralAllocatedToMM = collateralAllocatedToMM.div(10**(uint256(8).sub(collateralAssetDecimals)));
        }

        uint256 modifiedBal = collateralAllocatedToMM.mul(borrowPCT[collateralAsset]).div(TOTAL_PCT);
        return
            whitelistedBorrower[_borrower] &&
                !oToken.isPut() &&
                oToken.expiryTimestamp() > block.timestamp &&
                modifiedBal > borrowed[_borrower][collateralAsset]
                ? modifiedBal.sub(borrowed[_borrower][collateralAsset])
                : 0;
    }

    /**
     * @notice Repays asset back to pool before oToken expiry
     * @param _oToken address of the oToken laying claim to the collateral assets
     * @param _amount amount of the asset to repay
     */
    function repay(address _oToken, uint256 _amount) public {
        _repay(_oToken, _amount, msg.sender, msg.sender);
    }

    /**
     * @notice Repays asset back to pool for another borrower before oToken expiry
     * @param _oToken address of the oToken laying claim to the collateral assets
     * @param _amount amount of the asset to repay
     * @param _borrower address of the borrower to repay for
     */
    function repayFor(
        address _oToken,
        uint256 _amount,
        address _borrower
    ) public {
        require(_borrower != address(0), "MarginPool: Borrower cannot be zero address");
        _repay(_oToken, _amount, _borrower, msg.sender);
    }

    /**
     * @notice Repays asset back to pool for another borrower before oToken expiry
     * @param _oToken address of the oToken laying claim to the collateral assets
     * @param _amount amount of the asset to repay
     * @param _borrower address of the borrower to repay for
     * @param _repayer address of the repayer of the loan
     */
    function _repay(
        address _oToken,
        uint256 _amount,
        address _borrower,
        address _repayer
    ) internal {
        require(_amount > 0, "MarginPool: Cannot repay 0 of underlying");

        address collateralAsset = OtokenInterface(_oToken).collateralAsset();
        uint256 outstandingAssetBorrow = borrowed[_borrower][collateralAsset];

        require(_amount <= outstandingAssetBorrow, "MarginPool: Repaying more than outstanding borrow amount");

        borrowed[_borrower][collateralAsset] = borrowed[_borrower][collateralAsset].sub(_amount);

        uint256 collateralAssetDecimals = ERC20Interface(collateralAsset).decimals();

        uint256 oTokensToRedeem = collateralAssetDecimals >= 8
            ? _amount.div(10**(collateralAssetDecimals.sub(8)))
            : _amount.mul(10**(uint256(8).sub(collateralAssetDecimals)));

        // transfer _amount of collateralAsset from borrower to pool
        ERC20Interface(collateralAsset).safeTransferFrom(_repayer, address(this), _amount);
        // transfer oTokensToRedeem of oToken from pool to _borrower
        ERC20Interface(_oToken).safeTransfer(_borrower, oTokensToRedeem);
        emit Repay(_oToken, collateralAsset, _amount, _borrower, _repayer);
    }
}
