// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IAgentRegistry
/// @notice Interface for the AgentRegistry contract that manages AI agent identities
///         on the TAG platform.
interface IAgentRegistry {
    // ─────────────────────────────── Structs ─────────────────────────────────

    /// @notice Complete identity record for a registered AI trading agent.
    struct AgentInfo {
        uint256 agentId;
        address owner;
        string name;
        string strategy;         // Agent's trading strategy description
        string tradingThesis;    // Public thesis shown on social profile
        uint256 feePercent;      // Operator fee in basis points (0–2000 = 0%–20%)
        uint256 registeredAt;
        uint256 totalTrades;
        uint256 reputationScore; // Accumulated from reviews + performance
        bool isActive;
    }

    /// @notice A review submitted by a past delegator for an agent.
    struct AgentReview {
        address reviewer;   // Must be a past delegator
        uint256 agentId;
        uint8 rating;       // 1–5 inclusive
        string comment;
        uint256 timestamp;
    }

    // ─────────────────────────────── Events ──────────────────────────────────

    /// @notice Emitted when a new agent is registered.
    /// @param agentId   Unique identifier assigned to the agent.
    /// @param owner     Address that registered the agent.
    /// @param name      Human-readable agent name.
    /// @param feePercent Operator fee in basis points.
    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        string name,
        uint256 feePercent
    );

    /// @notice Emitted when an agent's active status is toggled.
    /// @param agentId  The agent affected.
    /// @param isActive New active status.
    event AgentStatusChanged(uint256 indexed agentId, bool isActive);

    /// @notice Emitted when an agent's metadata is updated.
    /// @param agentId The agent updated.
    event AgentUpdated(uint256 indexed agentId);

    /// @notice Emitted when a review is posted.
    /// @param agentId  The reviewed agent.
    /// @param reviewer The reviewer address.
    /// @param rating   Score 1–5.
    event ReviewSubmitted(uint256 indexed agentId, address indexed reviewer, uint8 rating);

    /// @notice Emitted when the on-chain trade counter is incremented.
    /// @param agentId     The agent that executed the trade.
    /// @param totalTrades Updated total trade count.
    event TradeRecorded(uint256 indexed agentId, uint256 totalTrades);

    // ──────────────────────────────── Errors ─────────────────────────────────

    error AgentRegistry__AlreadyRegistered(address owner);
    error AgentRegistry__FeeTooHigh(uint256 provided, uint256 max);
    error AgentRegistry__AgentNotFound(uint256 agentId);
    error AgentRegistry__NotAgentOwner(address caller, uint256 agentId);
    error AgentRegistry__AgentInactive(uint256 agentId);
    error AgentRegistry__RatingOutOfRange(uint8 rating);
    error AgentRegistry__NotEligibleReviewer(address caller, uint256 agentId);
    error AgentRegistry__AlreadyReviewed(address caller, uint256 agentId);
    error AgentRegistry__EmptyName();
    error AgentRegistry__NotDelegationVault();

    // ─────────────────────────────── Functions ───────────────────────────────

    /// @notice Registers a new AI agent on-chain.
    /// @param name           Display name for the agent.
    /// @param strategy       Description of the trading strategy.
    /// @param tradingThesis  Public thesis for the agent's social profile.
    /// @param feePercent     Operator fee in basis points (max 2000).
    /// @return agentId       Newly assigned agent identifier.
    function registerAgent(
        string calldata name,
        string calldata strategy,
        string calldata tradingThesis,
        uint256 feePercent
    ) external returns (uint256 agentId);

    /// @notice Deactivates an agent so it no longer accepts new delegations.
    /// @param agentId  The agent to deactivate.
    function deactivateAgent(uint256 agentId) external;

    /// @notice Reactivates a previously deactivated agent.
    /// @param agentId  The agent to reactivate.
    function reactivateAgent(uint256 agentId) external;

    /// @notice Updates mutable metadata fields for an agent.
    /// @param agentId        Agent to update.
    /// @param strategy       New strategy description.
    /// @param tradingThesis  New trading thesis.
    /// @param feePercent     New operator fee in basis points.
    function updateAgent(
        uint256 agentId,
        string calldata strategy,
        string calldata tradingThesis,
        uint256 feePercent
    ) external;

    /// @notice Submits a review for an agent. Caller must be a past delegator.
    /// @param agentId  Agent being reviewed.
    /// @param rating   Score between 1 and 5.
    /// @param comment  Optional text comment.
    function submitReview(uint256 agentId, uint8 rating, string calldata comment) external;

    /// @notice Called by DelegationVault to increment an agent's trade counter.
    /// @param agentId  Agent that executed a trade.
    function recordTrade(uint256 agentId) external;

    /// @notice Called by DelegationVault to mark an address as a past delegator,
    ///         enabling them to submit reviews.
    /// @param agentId   Agent the user delegated to.
    /// @param delegator The delegating address.
    function markAsDelegator(uint256 agentId, address delegator) external;

    /// @notice Returns the full AgentInfo struct for a given agent ID.
    /// @param agentId  Agent identifier.
    /// @return info    The AgentInfo struct.
    function getAgent(uint256 agentId) external view returns (AgentInfo memory info);

    /// @notice Returns all reviews for a given agent.
    /// @param agentId  Agent identifier.
    /// @return         Array of AgentReview structs.
    function getReviews(uint256 agentId) external view returns (AgentReview[] memory);

    /// @notice Returns the agent ID owned by a given address, or 0 if none.
    /// @param owner  The operator address.
    /// @return       The agent ID.
    function getAgentIdByOwner(address owner) external view returns (uint256);

    /// @notice Returns true if agentId is registered and active.
    /// @param agentId  Agent identifier.
    /// @return         Active status.
    function isAgentActive(uint256 agentId) external view returns (bool);
}
