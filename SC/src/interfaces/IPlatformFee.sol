// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IPlatformFee
/// @notice Interface for the PlatformFee contract that charges and accumulates
///         TAG's 0.1% per-trade protocol fee in USDC.
interface IPlatformFee {
    // ─────────────────────────────── Events ──────────────────────────────────

    /// @notice Emitted when a fee is charged for a trade.
    /// @param agentId    Agent that executed the trade.
    /// @param tradeSize  Notional trade size in USDC (6-decimal).
    /// @param feeAmount  USDC fee collected.
    event FeeCharged(uint256 indexed agentId, uint256 tradeSize, uint256 feeAmount);

    /// @notice Emitted when the platform owner withdraws accumulated fees.
    /// @param to     Recipient address.
    /// @param amount USDC amount withdrawn.
    event FeesWithdrawn(address indexed to, uint256 amount);

    /// @notice Emitted when the fee percentage is updated.
    /// @param oldFee Previous fee in basis points.
    /// @param newFee New fee in basis points.
    event FeePercentUpdated(uint256 oldFee, uint256 newFee);

    // ──────────────────────────────── Errors ─────────────────────────────────

    error PlatformFee__FeeTooHigh(uint256 provided, uint256 max);
    error PlatformFee__ZeroTradeSize();
    error PlatformFee__NothingToWithdraw();
    error PlatformFee__NotAuthorized(address caller);
    error PlatformFee__TransferFailed();
    error PlatformFee__ZeroAddress();

    // ─────────────────────────────── Functions ───────────────────────────────

    /// @notice Charges the platform fee on a trade.
    ///         Transfers `feeAmount` USDC from `msg.sender` to this contract.
    ///         Only authorised callers (DelegationVault) may invoke this.
    /// @param agentId    Agent executing the trade.
    /// @param tradeSize  Notional USDC trade size (6-decimal).
    /// @return feeAmount USDC fee collected.
    function chargeFee(uint256 agentId, uint256 tradeSize) external returns (uint256 feeAmount);

    /// @notice Updates the platform fee percentage.
    ///         Only callable by the contract owner.
    /// @param newFeePercent New fee in basis points (max 1000 = 10%).
    function updateFeePercent(uint256 newFeePercent) external;

    /// @notice Withdraws all accumulated USDC fees to a recipient address.
    ///         Only callable by the contract owner.
    /// @param to  Recipient address.
    function withdrawFees(address to) external;

    /// @notice Computes the fee amount for a given trade size without state change.
    /// @param tradeSize  Notional USDC trade size.
    /// @return feeAmount Expected fee in USDC.
    function computeFee(uint256 tradeSize) external view returns (uint256 feeAmount);

    /// @notice Returns the current fee percentage in basis points.
    /// @return Current fee in basis points.
    function feePercent() external view returns (uint256);

    /// @notice Returns the total USDC fees accumulated and not yet withdrawn.
    /// @return Accumulated USDC fees.
    function accumulatedFees() external view returns (uint256);
}
