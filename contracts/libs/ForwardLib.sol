/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import {Actions} from "../libs/Actions.sol";
import {MarginVault} from "./MarginVault.sol";
import {MarginPoolInterface} from "../interfaces/MarginPoolInterface.sol";
import {OtokenInterface} from "../interfaces/OtokenInterface.sol";
import {WhitelistInterface} from "../interfaces/WhitelistInterface.sol";
import {MarginVault} from "./MarginVault.sol";

library forwards {
    /// @notice emits an event when a long oToken is deposited into a vault
    event LongOtokenDeposited(
    address indexed otoken,
    address indexed accountOwner,
    address indexed from,
    uint256 vaultId,
    uint256 amount
    );
    /// @notice emits an event when a short oToken is minted from a vault
    event ShortOtokenMinted(
        address indexed otoken,
        address indexed AccountOwner,
        address indexed to,
        uint256 vaultId,
        uint256 amount
    );
    /// @notice emits an event when a short oToken is burned
    event ShortOtokenBurned(
        address indexed otoken,
        address indexed AccountOwner,
        address indexed from,
        uint256 vaultId,
        uint256 amount
    );
    /// @notice emits an event when a short oToken is burned
    event LongOtokenBurned(
        address indexed otoken,
        address indexed AccountOwner,
        address indexed from,
        uint256 vaultId,
        uint256 amount
    );
    
    /**
     * @notice check if a vault id is valid for a given account owner address
     * @param _accountOwner account owner address
     * @param _vaultId vault id to check
     * @return True if the _vaultId is valid, False if not
     */
    function _checkVaultId(address _accountOwner, uint256 _vaultId, uint256 vaultCount) internal view returns (bool) {
        return ((_vaultId > 0) && (_vaultId <= vaultCount));
    }

    /** 
     * @notice mint a forward into the vault by deposit a longOtoken and Minting a short option
     * @dev only the account owner or operater can deposit a long forward, cannot be called when system is partiallyPaused or fullyPaused
     * @param _args DepositArgs structure
     *
    **/
    function _mintForward(Actions.depositForwardArgs memory _args, WhitelistInterface whitelist, MarginVault.Vault storage vault, uint256 vaultType, MarginPoolInterface pool, MarginPoolInterface borrowablePool, uint256 vaultCount)
        external
    {
        require(_checkVaultId(_args.owner, _args.vaultId, vaultCount), "C35");
        // only allow vault owner or vault operator to deposit long oToken
        require((_args.from == msg.sender) || (_args.from == _args.owner), "C16");

        require(whitelist.isWhitelistedOtoken(_args.asset), "C17");

        OtokenInterface shortOtoken = OtokenInterface(_args.otoken);
        OtokenInterface longOtoken = OtokenInterface(_args.asset);

        // verify expiry timestamp and strike are identical
        require(shortOtoken.expiryTimestamp() == longOtoken.expiryTimestamp(), "C18");
        require(shortOtoken.strikePrice() == longOtoken.strikePrice(), "C18");

        require(now < shortOtoken.expiryTimestamp(), "C18");
        require(now < longOtoken.expiryTimestamp(), "C18");

        MarginVault.addForward(vault, _args.asset, _args.otoken, _args.amount);

        // mints the short leg
        shortOtoken.mintOtoken(_args.to, _args.amount);

        MarginPoolInterface(_getPool(vaultType, pool, borrowablePool)).transferToPool(
            _args.asset,
            _args.from,
            _args.amount
        );

        // emit that both long a short were minted.
        emit LongOtokenDeposited(_args.asset, _args.owner, _args.from, _args.vaultId, _args.amount);
        emit ShortOtokenMinted(_args.otoken, _args.owner, _args.to, _args.vaultId, _args.amount);
    }
    /**
    * @notice burn forwards to reduce or remove the minted oToken obligation and long recorded in a vault
    * @dev only the account owner or operator can burn an oToken, cannot be called when system is partiallyPaused or fullyPaused
    * @param _args MintArgs structure
    */
    function _burnForward(Actions.BurnForwardArgs memory _args, WhitelistInterface whitelist, MarginVault.Vault storage vault, uint256 vaultType, MarginPoolInterface pool, MarginPoolInterface borrowablePool, uint256 vaultCount)
        external
    {
        // check that vault id is valid for this vault owner
        require(_checkVaultId(_args.owner, _args.vaultId, vaultCount), "C35");
        // only allow vault owner or vault operator to burn otoken
        require((_args.from == msg.sender) || (_args.from == _args.owner), "C23");

        OtokenInterface longOtoken = OtokenInterface(_args.asset);
        OtokenInterface shortOtoken = OtokenInterface(_args.otoken);

        // do not allow burning expired otoken
        require(now < longOtoken.expiryTimestamp(), "C19");
        require(now < shortOtoken.expiryTimestamp(), "C24");

        // remove long otoken from vault
        MarginVault.removeLong(vault, _args.asset, _args.amount, _args.index);
        
        // remove short otoken from vault
        MarginVault.removeLong(vault, _args.otoken, _args.amount, _args.index);

        // burn short Otoken
        shortOtoken.burnOtoken(_args.from, _args.amount);
        // burn long Otoken
        longOtoken.burnOtoken(_args.from, _args.amount);

        emit ShortOtokenBurned(_args.otoken, _args.owner, _args.from, _args.vaultId, _args.amount);
        emit LongOtokenBurned(_args.asset, _args.owner, _args.to, _args.vaultId, _args.amount);
    }

    /**
     * @dev checks correct pool for vault type. type 0 or 1: non-borrowable pool, type 2: borrowable pool
     * @param _vaultType type of the vault
     * @return margin pool corresponding to the vault
     */
    function _getPool(uint256 _vaultType, MarginPoolInterface pool, MarginPoolInterface borrowablePool) internal view returns (address) {
        return _vaultType < 2 ? address(pool) : address(borrowablePool);
    }
}