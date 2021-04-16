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
    /// @dev Canonical order structure
    struct LimitOrder {
        address makerToken; // The ERC20 token the maker is selling and the maker is selling to the taker.
        address takerToken; // The ERC20 token the taker is selling and the taker is selling to the maker.
        uint128 makerAmount; // The amount of makerToken being sold by the maker.
        uint128 takerAmount; // The amount of takerToken being sold by the taker.
        uint128 takerTokenFeeAmount; // Amount of takerToken paid by the taker to the feeRecipient.
        address maker; // The address of the maker, and signer, of this order.
        address taker; // Allowed taker address. Set to zero to allow any taker.
        address sender; // Allowed address to call fillLimitOrder() (msg.sender). This is the same as taker, expect when using meta-transactions. Set to zero to allow any caller.
        address feeRecipient; // Recipient of maker token or taker token fees (if non-zero).
        bytes32 pool; // The staking pool to attribute the 0x protocol fee from this order. Set to zero to attribute to the default pool, not owned by anyone.
        uint64 expiry; // The Unix timestamp in seconds when this order expires.
        uint256 salt; // Arbitrary number to facilitate uniqueness of the order's hash.
    }

    struct Signature {
        uint8 signatureType; // Either 2 (EIP712) or 3 (EthSign)
        uint8 v; // Signature data.
        bytes32 r; // Signature data.
        bytes32 s; // Signature data.
    }

    /// @dev Executes multiple calls of fillLimitOrder.
    /// @param orders Array of order specifications.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to sell in orders.
    /// @param signatures Array of proofs that orders have been created by makers.
    /// @return takerTokenFilledAmounts Array of amount of takerToken(s) filled.
    /// @return makerTokenFilledAmounts Array of amount of makerToken(s) filled.
    function batchFillLimitOrders(
        LimitOrder[] memory orders,
        Signature[] memory signatures,
        uint128[] memory takerTokenFillAmounts,
        bool revertIfIncomplete
    ) external payable returns (uint128[] memory takerTokenFilledAmounts, uint128[] memory makerTokenFilledAmounts);
}
