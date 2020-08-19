pragma solidity =0.6.10;

import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * SPDX-License-Identifier: UNLICENSED
 * @dev The MarginAccount is a library that provides Controller with an Account of Vault structs, and
 * the functions that manipulate vaults. Vaults describe positions that users have.
 */
library MarginAccount {
    using SafeMath for uint256;

    // Account is a struct corresponding to a user that describes how many vaults that user has.
    struct Account {
        // the owner whose vaults we are looking for
        address owner;
        // the number of vaults a user has, starting at index 0 and incrementing. vaultIds sorted chronologically.
        uint256 vaultIds;
    }

    // Vault is a struct of 6 arrays that describe a position a user has. A user can have multiple vaults.
    struct Vault {
        // the addresses of oTokens a user has shorted (i.e. written) against this vault, including those in spreads/combos
        address[] shortOtokens;
        // the addresses of oTokens a user has gone long (i.e. bought) in this vault, including those in spreads/combos.
        // User can be long oTokens without opening a vault (e.g. by buying on a DEX).
        // Generally, long oTokens will be 'deposited' in vaults to act as collateral in order to write oTokens against (i.e. in spreads/combos).
        address[] longOtokens;
        // the addresses of other tokens a user has deposited as collateral in this vault
        address[] collateralAssets;
        // describes the quantity of options shorted for each oToken address in shortOtokens
        uint256[] shortAmounts;
        // describes the quantity of options longed in the vault for each oToken address in longOtokens
        uint256[] longAmounts;
        // describes the quantity of tokens deposited as collateral in the vault for each token address in collateralAssets
        uint256[] collateralAmounts;
    }

    /**
     * @dev Increment vault numbers in account
     * @param _account The account relating to the user for whom the protocol is opening the new vault.
     */
    function _openNewVault(Account storage _account) internal {
        _account.vaultIds = _account.vaultIds.add(1);
    }

    /**
     * @dev increase the short oToken balance in a vault when a new oToken is minted.
     * @param _vault The vault the protocol is adding the short position to
     * @param _shortOtoken The address of the _shortOtoken the protocol is shorting from the user's vault
     * @param _amount The additional number of _shortOtoken the protocol is shorting from the user's vault
     * @param _index The index of _shortOtoken in the user's vault.shortOtokens array
     */
    function _addShort(
        Vault storage _vault,
        address _shortOtoken,
        uint256 _amount,
        uint256 _index
    ) internal {
        // Valid indexes in any array are between 0 and array.length - 1.
        // If adding amount into an existant short otoken, make sure _index in the range of 0->length-1
        if ((_index >= _vault.shortOtokens.length) && ((_index >= _vault.shortAmounts.length))) {
            _vault.shortOtokens.push(_shortOtoken);
            _vault.shortAmounts.push(_amount);
        } else {
            require(
                (_vault.shortOtokens[_index] == _shortOtoken) || (_vault.shortOtokens[_index] == address(0)),
                "MarginAccount: invalid short otoken position"
            );

            _vault.shortAmounts[_index] = _vault.shortAmounts[_index].add(_amount);
            _vault.shortOtokens[_index] = _shortOtoken;
        }
    }

    /**
     * @dev decrease the short oToken balance in a vault when an oToken is burned.
     * @param _vault The vault from which the protocol is decreasing the short position
     * @param _shortOtoken The address of the _shortOtoken of which the protocol is reducing the short position from the user's vault
     * @param _amount The number of _shortOtoken the protocol is reducing the user's position by from the user's vault
     * @param _index The index of _shortOtoken in the user's vault.shortOtokens array
     */
    function _removeShort(
        Vault storage _vault,
        address _shortOtoken,
        uint256 _amount,
        uint256 _index
    ) internal {
        // Check that the removed short otoken exists in the vault
        require(
            (_index < _vault.shortOtokens.length) && (_vault.shortOtokens[_index] == _shortOtoken),
            "MarginAccount: short otoken address mismatch"
        );

        _vault.shortAmounts[_index] = _vault.shortAmounts[_index].sub(_amount);

        if (_vault.shortAmounts[_index] == 0) {
            delete _vault.shortOtokens[_index];
        }
    }

    /**
     * @dev increase the long oToken balance in a vault when an oToken is deposited
     * @param _vault The vault the protocol is adding the long position to
     * @param _longOtoken The address of the _longOtoken the protocol is adding to the user's vault
     * @param _amount The number of _longOtoken the protocol is adding to the user's vault
     * @param _index The index of _longOtoken in the user's vault.longOtokens array
     */
    function _addLong(
        Vault storage _vault,
        address _longOtoken,
        uint256 _amount,
        uint256 _index
    ) internal {
        // Valid indexes in any array are between 0 and array.length - 1.
        // If adding amount into an existant long otoken, make sure _index in the range of 0->length-1
        if ((_index >= _vault.longOtokens.length) && ((_index >= _vault.longAmounts.length))) {
            _vault.longOtokens.push(_longOtoken);
            _vault.longAmounts.push(_amount);
        } else {
            require(
                (_vault.longOtokens[_index] == _longOtoken) || (_vault.longOtokens[_index] == address(0)),
                "MarginAccount: invalid long otoken position"
            );

            _vault.longAmounts[_index] = _vault.longAmounts[_index].add(_amount);
            _vault.longOtokens[_index] = _longOtoken;
        }
    }

    /**
     * @dev decrease the long oToken balance in a vault when an oToken is withdrawn
     * @param _vault The vault from which the protocol is decreasing the short position
     * @param _longOtoken The address of the _longOtoken of which the protocol is reducing the long position from the user's vault
     * @param _amount The number of _longOtoken the protocol is reducing the user's long position by from the user's vault
     * @param _index The index of _longOtoken in the user's vault.longOtokens array
     */
    function _removeLong(
        Vault storage _vault,
        address _longOtoken,
        uint256 _amount,
        uint256 _index
    ) internal {
        // Check that the removed long token exists in the vault
        require(
            (_index < _vault.longOtokens.length) && (_vault.longOtokens[_index] == _longOtoken),
            "MarginAccount: long otoken address mismatch"
        );

        _vault.longAmounts[_index] = _vault.longAmounts[_index].sub(_amount);

        if (_vault.longAmounts[_index] == 0) {
            delete _vault.longOtokens[_index];
        }
    }

    /**
     * @dev increase the collateral balance in a vault
     * @param _vault The vault to which the protocol is adding the collateral
     * @param _collateralAsset The address of the _collateralAsset which the protocol is adding to the user's vault
     * @param _amount The number of _collateralAsset the protocol is adding to the user's collateral position in the user's vault
     * @param _index The index of _collateralAsset in the user's vault.collateralAssets array
     */
    function _addCollateral(
        Vault storage _vault,
        address _collateralAsset,
        uint256 _amount,
        uint256 _index
    ) internal {
        // Valid indexes in any array are between 0 and array.length - 1.
        // If adding amount into an existing long otoken, make sure _index in the range of 0->length-1
        if ((_index >= _vault.collateralAssets.length) && ((_index >= _vault.collateralAmounts.length))) {
            _vault.collateralAssets.push(_collateralAsset);
            _vault.collateralAmounts.push(_amount);
        } else {
            require(
                (_vault.collateralAssets[_index] == _collateralAsset) ||
                    (_vault.collateralAssets[_index] == address(0)),
                "MarginAccount: invalid collateral token position"
            );

            _vault.collateralAmounts[_index] = _vault.collateralAmounts[_index].add(_amount);
            _vault.collateralAssets[_index] = _collateralAsset;
        }
    }

    /**
     * @dev decrease the collateral balance in a vault
     * @param _vault The vault from which the protocol is removing the collateral
     * @param _collateralAsset The address of the _collateralAsset which the protocol is removing from the user's vault
     * @param _amount The number of _collateralAsset the protocol is removing from the user's collateral position in the user's vault
     * @param _index The index of _collateralAsset in the user's vault.collateralAssets array
     */
    function _removeCollateral(
        Vault storage _vault,
        address _collateralAsset,
        uint256 _amount,
        uint256 _index
    ) internal {
        // Check the token is the same as vault.collateral[idx]
        require(
            (_index < _vault.collateralAssets.length) && (_vault.collateralAssets[_index] == _collateralAsset),
            "MarginAccount: collateral token address mismatch"
        );

        _vault.collateralAmounts[_index] = _vault.collateralAmounts[_index].sub(_amount);

        if (_vault.collateralAmounts[_index] == 0) {
            delete _vault.collateralAssets[_index];
        }
    }

    /**
     * @dev remove everything in a vault. Reset short, long and collateral assets and amounts arrays to an empty array.
     * @param _vault The vault that the user is clearing.
     */
    function _clearVault(Vault storage _vault) internal {
        delete _vault.shortAmounts;
        delete _vault.longAmounts;
        delete _vault.collateralAmounts;
        delete _vault.shortOtokens;
        delete _vault.longOtokens;
        delete _vault.collateralAssets;
    }
}
