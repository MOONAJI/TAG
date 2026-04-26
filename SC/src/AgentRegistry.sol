// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAgentRegistry.sol";

/// @title AgentRegistry
/// @notice On-chain registry for AI trading agents on the TAG platform.
///         Implements ERC-8004-inspired agent identity with on-chain reputation,
///         reviews, and trade-count tracking.
///
///         Key invariants:
///         - One agent per owner address.
///         - Operator fee cannot exceed MAX_FEE_PERCENT (2000 bps = 20%).
///         - Only past delegators (tracked by DelegationVault) may review.
///         - Each delegator may review an agent at most once.
contract AgentRegistry is IAgentRegistry, Ownable, ReentrancyGuard {
    // ─────────────────────────────── Constants ───────────────────────────────

    /// @notice Maximum operator fee: 2000 basis points = 20%.
    uint256 public constant MAX_FEE_PERCENT = 2000;

    /// @notice Reputation increment per 5-star review, decrement per 1-star.
    uint256 private constant REPUTATION_SCALE = 10;

    // ─────────────────────────────── State ───────────────────────────────────

    /// @notice Auto-incrementing agent ID counter. Starts at 1 so 0 means "not registered".
    uint256 private _nextAgentId;

    /// @notice Authorised address that can call privileged functions (DelegationVault).
    address public delegationVault;

    /// @notice Maps agentId → AgentInfo.
    mapping(uint256 => AgentInfo) public agents;

    /// @notice Maps owner address → their agentId (0 = unregistered).
    mapping(address => uint256) public ownerToAgentId;

    /// @notice Maps agentId → list of reviews.
    mapping(uint256 => AgentReview[]) public agentReviews;

    /// @notice Maps agentId → reviewer address → has reviewed.
    mapping(uint256 => mapping(address => bool)) public hasReviewed;

    /// @notice Maps agentId → delegator address → has ever delegated (eligible to review).
    mapping(uint256 => mapping(address => bool)) public hasDelegated;

    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Restricts a function to the configured DelegationVault address.
    modifier onlyDelegationVault() {
        if (msg.sender != delegationVault) revert AgentRegistry__NotDelegationVault();
        _;
    }

    /// @notice Restricts a function to the owner of a specific agent.
    /// @param agentId  Agent whose ownership is checked.
    modifier onlyAgentOwner(uint256 agentId) {
        if (agents[agentId].owner != msg.sender)
            revert AgentRegistry__NotAgentOwner(msg.sender, agentId);
        _;
    }

    /// @notice Reverts if the agent does not exist (id == 0 or owner == address(0)).
    /// @param agentId  Agent to validate.
    modifier agentExists(uint256 agentId) {
        if (agentId == 0 || agents[agentId].owner == address(0))
            revert AgentRegistry__AgentNotFound(agentId);
        _;
    }

    // ──────────────────────────── Constructor ────────────────────────────────

    /// @notice Deploys the registry. DelegationVault address can be set later via
    ///         `setDelegationVault` once that contract is deployed.
    constructor() Ownable(msg.sender) {
        // IDs begin at 1; 0 is the sentinel "no agent" value.
        _nextAgentId = 1;
    }

    // ──────────────────────────── Admin ──────────────────────────────────────

    /// @notice Sets the authorised DelegationVault address.
    ///         Can only be called once after deployment to lock the vault reference.
    /// @param vault  Address of the deployed DelegationVault contract.
    function setDelegationVault(address vault) external onlyOwner {
        // Allow re-configuration only during setup; once set, immutable in prod.
        delegationVault = vault;
    }

    // ─────────────────────────── Registration ────────────────────────────────

    /// @inheritdoc IAgentRegistry
    function registerAgent(
        string calldata name,
        string calldata strategy,
        string calldata tradingThesis,
        uint256 feePercent
    ) external nonReentrant returns (uint256 agentId) {
        // ── Checks ──────────────────────────────────────────────────────────
        if (bytes(name).length == 0) revert AgentRegistry__EmptyName();
        if (ownerToAgentId[msg.sender] != 0)
            revert AgentRegistry__AlreadyRegistered(msg.sender);
        if (feePercent > MAX_FEE_PERCENT)
            revert AgentRegistry__FeeTooHigh(feePercent, MAX_FEE_PERCENT);

        // ── Effects ─────────────────────────────────────────────────────────
        agentId = _nextAgentId++;

        agents[agentId] = AgentInfo({
            agentId: agentId,
            owner: msg.sender,
            name: name,
            strategy: strategy,
            tradingThesis: tradingThesis,
            feePercent: feePercent,
            registeredAt: block.timestamp,
            totalTrades: 0,
            reputationScore: 0,
            isActive: true
        });

        ownerToAgentId[msg.sender] = agentId;

        emit AgentRegistered(agentId, msg.sender, name, feePercent);
    }

    /// @inheritdoc IAgentRegistry
    function deactivateAgent(uint256 agentId)
        external
        agentExists(agentId)
        onlyAgentOwner(agentId)
    {
        // ── Checks ──────────────────────────────────────────────────────────
        // (modifier guards: agentExists + onlyAgentOwner)
        // Guard against redundant writes to save gas.
        if (!agents[agentId].isActive) return;

        // ── Effects ─────────────────────────────────────────────────────────
        agents[agentId].isActive = false;

        emit AgentStatusChanged(agentId, false);
    }

    /// @inheritdoc IAgentRegistry
    function reactivateAgent(uint256 agentId)
        external
        agentExists(agentId)
        onlyAgentOwner(agentId)
    {
        if (agents[agentId].isActive) return;

        agents[agentId].isActive = true;

        emit AgentStatusChanged(agentId, true);
    }

    /// @inheritdoc IAgentRegistry
    function updateAgent(
        uint256 agentId,
        string calldata strategy,
        string calldata tradingThesis,
        uint256 feePercent
    ) external agentExists(agentId) onlyAgentOwner(agentId) {
        // ── Checks ──────────────────────────────────────────────────────────
        if (feePercent > MAX_FEE_PERCENT)
            revert AgentRegistry__FeeTooHigh(feePercent, MAX_FEE_PERCENT);

        // ── Effects ─────────────────────────────────────────────────────────
        AgentInfo storage agent = agents[agentId];
        agent.strategy = strategy;
        agent.tradingThesis = tradingThesis;
        agent.feePercent = feePercent;

        emit AgentUpdated(agentId);
    }

    // ─────────────────────────────── Reviews ─────────────────────────────────

    /// @inheritdoc IAgentRegistry
    function submitReview(
        uint256 agentId,
        uint8 rating,
        string calldata comment
    ) external agentExists(agentId) nonReentrant {
        // ── Checks ──────────────────────────────────────────────────────────
        if (rating < 1 || rating > 5) revert AgentRegistry__RatingOutOfRange(rating);
        if (!hasDelegated[agentId][msg.sender])
            revert AgentRegistry__NotEligibleReviewer(msg.sender, agentId);
        if (hasReviewed[agentId][msg.sender])
            revert AgentRegistry__AlreadyReviewed(msg.sender, agentId);

        // ── Effects ─────────────────────────────────────────────────────────
        hasReviewed[agentId][msg.sender] = true;

        agentReviews[agentId].push(
            AgentReview({
                reviewer: msg.sender,
                agentId: agentId,
                rating: rating,
                comment: comment,
                timestamp: block.timestamp
            })
        );

        // Update reputation: each star above/below median (3) shifts score by REPUTATION_SCALE.
        // rating 5 → +20, 4 → +10, 3 → 0, 2 → -10, 1 → -20
        AgentInfo storage agent = agents[agentId];
        uint256 current = agent.reputationScore;

        if (rating >= 3) {
            // Positive contribution — safe from overflow (uint256 max is enormous)
            agent.reputationScore = current + (uint256(rating - 3) * REPUTATION_SCALE);
        } else {
            // Negative contribution — guard against underflow
            uint256 penalty = uint256(3 - rating) * REPUTATION_SCALE;
            agent.reputationScore = current >= penalty ? current - penalty : 0;
        }

        emit ReviewSubmitted(agentId, msg.sender, rating);
    }

    // ────────────────────────── Vault callbacks ───────────────────────────────

    /// @inheritdoc IAgentRegistry
    function recordTrade(uint256 agentId)
        external
        agentExists(agentId)
        onlyDelegationVault
    {
        // ── Effects ─────────────────────────────────────────────────────────
        uint256 newCount = agents[agentId].totalTrades + 1;
        agents[agentId].totalTrades = newCount;

        emit TradeRecorded(agentId, newCount);
    }

    /// @inheritdoc IAgentRegistry
    function markAsDelegator(uint256 agentId, address delegator)
        external
        agentExists(agentId)
        onlyDelegationVault
    {
        // Idempotent — no harm in setting to true multiple times.
        if (!hasDelegated[agentId][delegator]) {
            hasDelegated[agentId][delegator] = true;
        }
    }

    // ─────────────────────────────── Views ───────────────────────────────────

    /// @inheritdoc IAgentRegistry
    function getAgent(uint256 agentId)
        external
        view
        agentExists(agentId)
        returns (AgentInfo memory info)
    {
        info = agents[agentId];
    }

    /// @inheritdoc IAgentRegistry
    function getReviews(uint256 agentId)
        external
        view
        agentExists(agentId)
        returns (AgentReview[] memory)
    {
        return agentReviews[agentId];
    }

    /// @inheritdoc IAgentRegistry
    function getAgentIdByOwner(address owner) external view returns (uint256) {
        return ownerToAgentId[owner];
    }

    /// @inheritdoc IAgentRegistry
    function isAgentActive(uint256 agentId) external view returns (bool) {
        return agents[agentId].isActive;
    }

    /// @notice Returns the total number of agents ever registered.
    /// @return count  Total agents (including inactive).
    function totalAgents() external view returns (uint256 count) {
        // _nextAgentId starts at 1, so total = _nextAgentId - 1.
        count = _nextAgentId - 1;
    }
}
