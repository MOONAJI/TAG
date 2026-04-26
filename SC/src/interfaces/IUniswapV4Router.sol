// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IUniswapV4Router
/// @notice Minimal interface for executing swaps through Uniswap v4's Universal Router
///         as deployed on Celo. Full v4 integration (hooks, pool keys, etc.) is out
///         of scope for the initial TAG contracts; this stub captures the subset
///         the DelegationVault will use when live swap execution is added.
interface IUniswapV4Router {
    // ─────────────────────────────── Structs ─────────────────────────────────

    /// @notice Identifies a Uniswap v4 pool by its constituent tokens, fee tier,
    ///         tick spacing, and optional hook contract.
    struct PoolKey {
        address currency0;    // Lower-address token (or address(0) for native ETH)
        address currency1;    // Higher-address token
        uint24 fee;           // Pool fee in hundredths of a bip (e.g. 3000 = 0.30%)
        int24 tickSpacing;    // Minimum tick granularity
        address hooks;        // Hook contract address (address(0) if none)
    }

    /// @notice Parameters for a single-hop exact-input swap.
    struct ExactInputSingleParams {
        PoolKey poolKey;
        bool zeroForOne;          // True → swap currency0 for currency1
        uint128 amountIn;         // Exact amount of tokenIn to spend
        uint128 amountOutMinimum; // Minimum acceptable output (slippage guard)
        uint160 sqrtPriceLimitX96; // Price limit; 0 = no limit
        bytes hookData;           // Arbitrary data forwarded to the hook
    }

    /// @notice Parameters for a multi-hop exact-input swap.
    struct ExactInputParams {
        bytes path;               // ABI-encoded sequence of (token, fee, tickSpacing, hooks)
        address recipient;        // Address that receives the output tokens
        uint256 amountIn;         // Exact input amount
        uint256 amountOutMinimum; // Minimum acceptable cumulative output
    }

    /// @notice Parameters for a single-hop exact-output swap.
    struct ExactOutputSingleParams {
        PoolKey poolKey;
        bool zeroForOne;
        uint128 amountOut;        // Exact amount of tokenOut to receive
        uint128 amountInMaximum;  // Maximum amount of tokenIn to spend
        uint160 sqrtPriceLimitX96;
        bytes hookData;
    }

    // ─────────────────────────────── Events ──────────────────────────────────

    /// @notice Emitted by the router on every successful swap.
    /// @param sender      Initiator of the swap.
    /// @param recipient   Recipient of output tokens.
    /// @param tokenIn     Address of token sold.
    /// @param tokenOut    Address of token bought.
    /// @param amountIn    Exact amount of tokenIn consumed.
    /// @param amountOut   Actual amount of tokenOut received.
    event Swap(
        address indexed sender,
        address indexed recipient,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    // ─────────────────────────────── Functions ───────────────────────────────

    /// @notice Executes a single-hop exact-input swap.
    /// @param params    Swap parameters (see ExactInputSingleParams).
    /// @param recipient Address that receives the output tokens.
    /// @param deadline  Unix timestamp after which the transaction reverts.
    /// @return amountOut Actual output token amount received.
    function exactInputSingle(
        ExactInputSingleParams calldata params,
        address recipient,
        uint256 deadline
    ) external payable returns (uint256 amountOut);

    /// @notice Executes a multi-hop exact-input swap.
    /// @param params   Swap parameters (see ExactInputParams).
    /// @param deadline Unix timestamp after which the transaction reverts.
    /// @return amountOut Actual output token amount received.
    function exactInput(
        ExactInputParams calldata params,
        uint256 deadline
    ) external payable returns (uint256 amountOut);

    /// @notice Executes a single-hop exact-output swap.
    /// @param params    Swap parameters (see ExactOutputSingleParams).
    /// @param recipient Address that receives the output tokens.
    /// @param deadline  Unix timestamp after which the transaction reverts.
    /// @return amountIn Actual input token amount consumed.
    function exactOutputSingle(
        ExactOutputSingleParams calldata params,
        address recipient,
        uint256 deadline
    ) external payable returns (uint256 amountIn);

    /// @notice Returns the address of the Uniswap v4 PoolManager this router wraps.
    /// @return poolManager PoolManager contract address.
    function poolManager() external view returns (address poolManager);
}
