// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import {AgentRegistry} from "../src/AgentRegistry.sol";
import {DelegationVault} from "../src/DelegationVault.sol";
import {PlatformFee} from "../src/PlatformFee.sol";

/// @title Deploy
/// @notice Foundry deployment script for the full TAG contract suite on
///         Celo Mainnet (chainId 42220). Uses native USDC on Celo as the
///         settlement asset (NO MockUSDC on mainnet).
///
///         Usage:
///           forge script script/Deploy.s.sol \
///             --rpc-url $CELO_RPC_URL \
///             --broadcast \
///             --verify \
///             -vvvv
///
///         Required env vars:
///           PRIVATE_KEY      — deployer private key (0x-prefixed hex)
///           CELO_RPC_URL     — https://forno.celo.org
///           USDC_ADDRESS     — native USDC on Celo (0xcebA9300f2b948710d2653dD7B07f33A8B32118C)
///           EXPLORER_API_KEY — Celoscan key for --verify (optional)
contract Deploy is Script {
    // ──────────────────────────── Deployment state ───────────────────────────

    address         public usdc;
    AgentRegistry   public agentRegistry;
    DelegationVault public delegationVault;
    PlatformFee     public platformFee;

    // ─────────────────────────────── Entry point ─────────────────────────────

    function run() external {
        // Load deployer key + native USDC address from environment.
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);
        usdc                = vm.envAddress("USDC_ADDRESS");

        require(usdc != address(0), "USDC_ADDRESS not set");

        console.log("=== TAG Deployment (Celo Mainnet) ===");
        console.log("Deployer      :", deployer);
        console.log("USDC (native) :", usdc);
        console.log("Chain ID      :", block.chainid);
        console.log("Block         :", block.number);
        console.log("Timestamp     :", block.timestamp);
        console.log("");

        vm.startBroadcast(deployerKey);

        // ── 1. AgentRegistry ─────────────────────────────────────────────────
        agentRegistry = new AgentRegistry();
        console.log("AgentRegistry :", address(agentRegistry));

        // ── 2. PlatformFee ───────────────────────────────────────────────────
        platformFee = new PlatformFee(usdc);
        console.log("PlatformFee   :", address(platformFee));

        // ── 3. DelegationVault ───────────────────────────────────────────────
        delegationVault = new DelegationVault(
            usdc,
            address(agentRegistry),
            address(platformFee)
        );
        console.log("DelegationVault:", address(delegationVault));

        // ── 4. Wire up cross-contract references ─────────────────────────────
        agentRegistry.setDelegationVault(address(delegationVault));
        console.log("AgentRegistry.delegationVault set");

        platformFee.setAuthorisedCaller(address(delegationVault), true);
        console.log("PlatformFee authorised DelegationVault");

        vm.stopBroadcast();

        // ── 5. Print deployment summary ──────────────────────────────────────
        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("{");
        console.log('  "network": "celo-mainnet",');
        console.log('  "chainId": 42220,');
        console.log('  "contracts": {');
        console.log('    "USDC":            "%s",', usdc);
        console.log('    "AgentRegistry":   "%s",', address(agentRegistry));
        console.log('    "DelegationVault": "%s",', address(delegationVault));
        console.log('    "PlatformFee":     "%s"',  address(platformFee));
        console.log("  }");
        console.log("}");

        // ── 6. Persist deployment artifacts ──────────────────────────────────
        _writeDeploymentJson();
    }

    /// @notice Writes a JSON deployment artifact to `deployments/celo-mainnet.json`.
    function _writeDeploymentJson() internal {
        string memory json = string.concat(
            '{\n',
            '  "network": "celo-mainnet",\n',
            '  "chainId": 42220,\n',
            '  "contracts": {\n',
            '    "USDC": "',            vm.toString(usdc),                     '",\n',
            '    "AgentRegistry": "',   vm.toString(address(agentRegistry)),   '",\n',
            '    "DelegationVault": "', vm.toString(address(delegationVault)), '",\n',
            '    "PlatformFee": "',     vm.toString(address(platformFee)),     '"\n',
            '  }\n',
            '}\n'
        );

        string memory root = vm.projectRoot();
        vm.createDir(string.concat(root, "/deployments"), true);
        vm.writeFile(string.concat(root, "/deployments/celo-mainnet.json"), json);
        console.log("Deployment artifact written to deployments/celo-mainnet.json");
    }
}
