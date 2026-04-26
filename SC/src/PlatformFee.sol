// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IPlatformFee.sol";

/// @title PlatformFee
/// @notice Collects and manages TAG's per-trade protocol fee (default 0.1%).
///
///         Design notes:
///         - Default fee is 10 basis points (0.1%) consistent with the spec.
///         - Maximum fee is capped at 1000 bps (10%) to protect users from admin abuse.
///         - Authorised callers (DelegationVault) push USDC into this contract via
///           `chargeFee`; the platform owner may sweep accumulated fees at any time.
///         - The contract holds USDC; it does NOT do any token swaps.
contract PlatformFee is IPlatformFee, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────── Constants ───────────────────────────────

    /// @notice Maximum allowed fee: 1000 basis points = 10%.
    uint256 public constant MAX_FEE_PERCENT = 1000;

    /// @notice Basis-point denominator.
    uint256 private constant BPS_DENOM = 10_000;

    /// @notice Default fee on deployment: 10 bps = 0.10%.
    uint256 private constant DEFAULT_FEE_PERCENT = 10;

    // ─────────────────────────────── Immutables ──────────────────────────────

    /// @notice USDC token used for fee collection.
    IERC20 public immutable usdc;

    // ─────────────────────────────── State ───────────────────────────────────

    /// @notice Current fee in basis points.
    uint256 private _feePercent;

    /// @notice Total USDC fees accumulated and not yet withdrawn.
    uint256 private _accumulatedFees;

    /// @notice Addresses authorised to call `chargeFee` (i.e. DelegationVault).
    mapping(address => bool) public authorisedCallers;

    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Restricts a function to authorised callers only.
    modifier onlyAuthorised() {
        if (!authorisedCallers[msg.sender])
            revert PlatformFee__NotAuthorized(msg.sender);
        _;
    }

    // ──────────────────────────── Constructor ────────────────────────────────

    /// @notice Deploys PlatformFee.
    /// @param _usdc USDC token address.
    constructor(address _usdc) Ownable(msg.sender) {
        if (_usdc == address(0)) revert PlatformFee__ZeroAddress();
        usdc = IERC20(_usdc);
        _feePercent = DEFAULT_FEE_PERCENT;
    }

    // ──────────────────────────── Admin ──────────────────────────────────────

    /// @notice Grants or revokes authorisation for an address to call `chargeFee`.
    /// @param caller    Address to configure.
    /// @param authorised True to grant, false to revoke.
    function setAuthorisedCaller(address caller, bool authorised) external onlyOwner {
        if (caller == address(0)) revert PlatformFee__ZeroAddress();
        authorisedCallers[caller] = authorised;
    }

    // ─────────────────────────────── Fee logic ───────────────────────────────

    /// @inheritdoc IPlatformFee
    function chargeFee(uint256 agentId, uint256 tradeSize)
        external
        onlyAuthorised
        nonReentrant
        returns (uint256 feeAmount)
    {
        // ── Checks ──────────────────────────────────────────────────────────
        if (tradeSize == 0) revert PlatformFee__ZeroTradeSize();

        // ── Effects ─────────────────────────────────────────────────────────
        feeAmount = (tradeSize * _feePercent) / BPS_DENOM;
        _accumulatedFees += feeAmount;

        // ── Interactions ─────────────────────────────────────────────────────
        // The authorised caller (DelegationVault) must have approved this contract
        // OR must transfer USDC from the trade notional into this contract separately.
        // Here we pull directly from the caller who is expected to hold the fee USDC.
        usdc.safeTransferFrom(msg.sender, address(this), feeAmount);

        emit FeeCharged(agentId, tradeSize, feeAmount);
    }

    /// @inheritdoc IPlatformFee
    function updateFeePercent(uint256 newFeePercent) external onlyOwner {
        // ── Checks ──────────────────────────────────────────────────────────
        if (newFeePercent > MAX_FEE_PERCENT)
            revert PlatformFee__FeeTooHigh(newFeePercent, MAX_FEE_PERCENT);

        // ── Effects ─────────────────────────────────────────────────────────
        uint256 old = _feePercent;
        _feePercent = newFeePercent;

        emit FeePercentUpdated(old, newFeePercent);
    }

    /// @inheritdoc IPlatformFee
    function withdrawFees(address to) external onlyOwner nonReentrant {
        // ── Checks ──────────────────────────────────────────────────────────
        if (to == address(0)) revert PlatformFee__ZeroAddress();
        uint256 amount = _accumulatedFees;
        if (amount == 0) revert PlatformFee__NothingToWithdraw();

        // ── Effects ─────────────────────────────────────────────────────────
        _accumulatedFees = 0;

        // ── Interactions ─────────────────────────────────────────────────────
        usdc.safeTransfer(to, amount);

        emit FeesWithdrawn(to, amount);
    }

    // ─────────────────────────────── Views ───────────────────────────────────

    /// @inheritdoc IPlatformFee
    function computeFee(uint256 tradeSize) external view returns (uint256 feeAmount) {
        feeAmount = (tradeSize * _feePercent) / BPS_DENOM;
    }

    /// @inheritdoc IPlatformFee
    function feePercent() external view returns (uint256) {
        return _feePercent;
    }

    /// @inheritdoc IPlatformFee
    function accumulatedFees() external view returns (uint256) {
        return _accumulatedFees;
    }
}
