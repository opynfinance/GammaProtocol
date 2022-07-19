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
contract MarginPoolV2 is MarginPool {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Interface;

    uint16 public constant TOTAL_PCT = 10000; // Equals 100%

    /// @dev mapping between collateral asset and borrow PCT
    mapping(address => uint256) public borrowPCT;
    /// @dev mapping between address and whitelist status of borrower
    mapping(address => bool) public whitelistedBorrower;
    /// @dev mapping between address and whitelist status of otoken buyer
    /// This is the whitelist for all the holders of oTokens that have a claim to
    /// collateral in this pool
    mapping(address => bool) public whitelistedOTokenBuyer;
    /// @dev mapping between address and whitelist status of ribbon vault
    mapping(address => bool) public whitelistedRibbonVault;
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
    event SetOTokenBuyerWhitelist(address indexed buyer, bool whitelisted);
    /// @notice emit event when a ribbon vault is whitelisted / blacklisted
    event SetRibbonVaultWhitelist(address indexed ribbonVault, bool whitelisted);
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
     * @notice Set ribbon vault whitelist status
     * @param _ribbonVault address of the ribbon vault
     * @param _whitelisted bool of whether it is whitelisted or blacklisted
     */
    function setRibbonVaultWhitelistedStatus(address _ribbonVault, bool _whitelisted) external onlyOwner {
        require(_ribbonVault != address(0), "!_ribbonVault");

        whitelistedRibbonVault[_ribbonVault] = _whitelisted;
        emit SetRibbonVaultWhitelist(_ribbonVault, _whitelisted);
    }

    /**
     * @notice Set buyer whitelist status
     * @param _buyer address of the oToken buyer
     * @param _whitelisted bool of whether it is whitelisted or blacklisted
     */
    function setBuyerWhitelistedStatus(address _buyer, bool _whitelisted) external onlyOwner {
        require(_buyer != address(0), "!_buyer");

        whitelistedOTokenBuyer[_buyer] = _whitelisted;
        emit SetOTokenBuyerWhitelist(_buyer, _whitelisted);
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

        OtokenInterface oToken = OtokenInterface(_oToken);

        address collateralAsset = oToken.collateralAsset();
        uint256 outstandingAssetBorrow = borrowed[msg.sender][collateralAsset];

        require(!oToken.isPut(), "MarginPool: oToken is not a call option");

        require(borrowPCT[collateralAsset] > 0, "MarginPool: Borrowing is paused for collateral asset");

        // Make sure borrow does not attempt to borrow with an expired oToken
        require(
            oToken.expiryTimestamp() > block.timestamp,
            "MarginPool: Cannot borrow collateral asset of expired oToken"
        );

        uint256 collateralAssetDecimals = ERC20Interface(collateralAsset).decimals();

        // Each oToken represents 1:1 of collateral token
        // So a market maker can borrow at most our oToken balance in the collateral asset
        uint256 collateralAllocatedToMM = ERC20Interface(_oToken).balanceOf(msg.sender);
        if (collateralAssetDecimals >= 8) {
            collateralAllocatedToMM = collateralAllocatedToMM.mul(10**(collateralAssetDecimals.sub(8)));
        } else {
            collateralAllocatedToMM = collateralAllocatedToMM.div(10**(uint256(8).sub(collateralAssetDecimals)));
        }

        require(
            _amount <=
                collateralAllocatedToMM.mul(borrowPCT[collateralAsset]).div(TOTAL_PCT).sub(outstandingAssetBorrow),
            "MarginPool: Borrowing more than allocated"
        );

        borrowed[msg.sender][collateralAsset] = outstandingAssetBorrow.add(_amount);

        // transfer _asset _amount from pool to borrower
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
        address collateralAsset = OtokenInterface(_oToken).collateralAsset();
        uint256 outstandingAssetBorrow = borrowed[_borrower][collateralAsset];

        require(_amount <= outstandingAssetBorrow, "MarginPool: Repaying more than outstanding borrow amount");

        borrowed[_borrower][collateralAsset] = borrowed[_borrower][collateralAsset].sub(_amount);

        // transfer _asset _amount from pool to borrower
        ERC20Interface(collateralAsset).safeTransferFrom(_repayer, address(this), _amount);
        emit Repay(_oToken, collateralAsset, _amount, _borrower, _repayer);
    }
}
