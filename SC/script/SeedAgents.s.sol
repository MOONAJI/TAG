// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import {AgentRegistry} from "../src/AgentRegistry.sol";
import {IAgentRegistry} from "../src/interfaces/IAgentRegistry.sol";

/// @notice Registers the two seed agents (FX = id 1, Yield = id 2) used by the
///         FE dashboard slot map. Each agent must be owned by a distinct EOA,
///         so this script derives two deterministic operator keys from a salt,
///         funds them with native CELO from the deployer, then broadcasts
///         `registerAgent` from each.
contract SeedAgents is Script {
    // Registry must already be deployed; address is read from env so this
    // script is safe to re-use across redeployments.
    //   REGISTRY_ADDR = 0x...   (deployed AgentRegistry)
    //   PRIVATE_KEY   = ...     (deployer who holds CELO to fund operators)

    // Celo gas is cheap — 0.05 CELO per operator is plenty for a few txs.
    uint256 internal constant GAS_FUNDING = 0.05 ether;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer   = vm.addr(deployerKey);
        address registryAddr = vm.envAddress("REGISTRY_ADDR");

        AgentRegistry registry = AgentRegistry(registryAddr);

        // Deterministic operator keys derived from a project-specific salt so
        // reruns are idempotent (same addresses → registerAgent reverts
        // cleanly if already registered).
        uint256 fxKey    = uint256(keccak256("tag:seed:fx:v1"));
        uint256 yieldKey = uint256(keccak256("tag:seed:yield:v1"));
        address fxOp    = vm.addr(fxKey);
        address yieldOp = vm.addr(yieldKey);

        console.log("=== TAG Seed Agents ===");
        console.log("Deployer :", deployer);
        console.log("Registry :", registryAddr);
        console.log("FX op    :", fxOp);
        console.log("Yield op :", yieldOp);

        // ── Fund operators from the deployer so they can pay gas ────────────
        vm.startBroadcast(deployerKey);
        if (fxOp.balance < GAS_FUNDING) {
            (bool ok1,) = fxOp.call{value: GAS_FUNDING}("");
            require(ok1, "fund fx op failed");
        }
        if (yieldOp.balance < GAS_FUNDING) {
            (bool ok2,) = yieldOp.call{value: GAS_FUNDING}("");
            require(ok2, "fund yield op failed");
        }
        vm.stopBroadcast();

        // ── FX agent (expected id = 1) ──────────────────────────────────────
        uint256 fxId = _registerIfNeeded(
            registry,
            fxKey,
            "TAG FX Agent",
            "Momentum / Carry",
            "Systematic momentum and carry trades across synthetic FX pairs, with drawdown-aware position sizing.",
            500 // 5% operator fee (bps)
        );
        console.log("FX agentId   :", fxId);

        // ── Yield agent (expected id = 2) ───────────────────────────────────
        uint256 yieldId = _registerIfNeeded(
            registry,
            yieldKey,
            "TAG Yield Agent",
            "Auto-Compounding LP",
            "Auto-compounds stablecoin and blue-chip LP positions across Celo DEXs with on-chain yield rotation.",
            500
        );
        console.log("Yield agentId:", yieldId);

        require(fxId == 1,    "FX must be agentId 1 (dashboard slot assumption)");
        require(yieldId == 2, "Yield must be agentId 2 (dashboard slot assumption)");

        console.log("Total agents :", registry.totalAgents());
    }

    function _registerIfNeeded(
        AgentRegistry registry,
        uint256 key,
        string memory name,
        string memory strategy,
        string memory thesis,
        uint256 feePercent
    ) internal returns (uint256 agentId) {
        address op = vm.addr(key);
        agentId = registry.getAgentIdByOwner(op);
        if (agentId != 0) {
            return agentId;
        }
        vm.startBroadcast(key);
        agentId = registry.registerAgent(name, strategy, thesis, feePercent);
        vm.stopBroadcast();
    }
}
