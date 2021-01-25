/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

/**
 * @dev ZeroX Exchange contract interface.
 */
interface ZeroXExchangeInterface {
    // solhint-disable max-line-length
    /// @dev Canonical order structure.
    struct Order {
        address makerAddress; // Address that created the order.
        address takerAddress; // Address that is allowed to fill the order. If set to 0, any address is allowed to fill the order.
        address feeRecipientAddress; // Address that will recieve fees when order is filled.
        address senderAddress; // Address that is allowed to call Exchange contract methods that affect this order. If set to 0, any address is allowed to call these methods.
        uint256 makerAssetAmount; // Amount of makerAsset being offered by maker. Must be greater than 0.
        uint256 takerAssetAmount; // Amount of takerAsset being bid on by maker. Must be greater than 0.
        uint256 makerFee; // Fee paid to feeRecipient by maker when order is filled.
        uint256 takerFee; // Fee paid to feeRecipient by taker when order is filled.
        uint256 expirationTimeSeconds; // Timestamp in seconds at which order expires.
        uint256 salt; // Arbitrary number to facilitate uniqueness of the order's hash.
        bytes makerAssetData; // Encoded data that can be decoded by a specified proxy contract when transferring makerAsset. The leading bytes4 references the id of the asset proxy.
        bytes takerAssetData; // Encoded data that can be decoded by a specified proxy contract when transferring takerAsset. The leading bytes4 references the id of the asset proxy.
        bytes makerFeeAssetData; // Encoded data that can be decoded by a specified proxy contract when transferring makerFeeAsset. The leading bytes4 references the id of the asset proxy.
        bytes takerFeeAssetData; // Encoded data that can be decoded by a specified proxy contract when transferring takerFeeAsset. The leading bytes4 references the id of the asset proxy.
    }

    struct FillResults {
        uint256 makerAssetFilledAmount; // Total amount of makerAsset(s) filled.
        uint256 takerAssetFilledAmount; // Total amount of takerAsset(s) filled.
        uint256 makerFeePaid; // Total amount of fees paid by maker(s) to feeRecipient(s).
        uint256 takerFeePaid; // Total amount of fees paid by taker to feeRecipients(s).
        uint256 protocolFeePaid; // Total amount of fees paid by taker to the staking contract.
    }

    struct Transaction {
        uint256 salt; // Arbitrary number to facilitate uniqueness of the order's hash.
        uint256 expirationTimeSeconds; // Timestamp in seconds at which order expires.
        uint256 gasPrice;
        address signerAddress;
        bytes data;
    }

    /// @dev Fills the input order.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return fillResults Amounts filled and fees paid by maker and taker.
    function fillOrder(
        Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    ) external payable returns (FillResults memory fillResults);

    /// @dev Executes multiple calls of fillOrder.
    /// @param orders Array of order specifications.
    /// @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return fillResults Array of amounts filled and fees paid by makers and taker.
    function batchFillOrders(
        Order[] memory orders,
        uint256[] memory takerAssetFillAmounts,
        bytes[] memory signatures
    ) external payable returns (FillResults[] memory fillResults);

    function executeTransaction(Transaction memory transaction, bytes memory signature)
        external
        payable
        returns (bytes memory);

    function preSign(bytes32 hash) external;

    /// @dev Verifies that a signature for a transaction is valid.
    /// @param transaction The transaction.
    /// @param signature Proof that the order has been signed by signer.
    /// @return isValid `true` if the signature is valid for the given transaction and signer.
    function isValidTransactionSignature(Transaction memory transaction, bytes memory signature)
        external
        view
        returns (bool isValid);

    /// @dev Verifies that a signature for an order is valid.
    /// @param order The order.
    /// @param signature Proof that the order has been signed by signer.
    /// @return isValid `true` if the signature is valid for the given order and signer.
    function isValidOrderSignature(Order memory order, bytes memory signature) external view returns (bool isValid);
}
