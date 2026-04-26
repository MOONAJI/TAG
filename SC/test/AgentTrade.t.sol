// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {DelegationVault} from "../src/DelegationVault.sol";
import {PlatformFee} from "../src/PlatformFee.sol";
import {IAgentRegistry} from "../src/interfaces/IAgentRegistry.sol";
import {IDelegationVault} from "../src/interfaces/IDelegationVault.sol";
import {IPlatformFee} from "../src/interfaces/IPlatformFee.sol";

/// @title AgentTradeTest
/// @notice Full test coverage for the TAG protocol contracts.
///         Organized into labelled sections matching the spec's test matrix.
contract AgentTradeTest is Test {
    // ──────────────────────────────── Contracts ───────────────────────────────

    MockUSDC        internal usdc;
    AgentRegistry   internal registry;
    DelegationVault internal vault;
    PlatformFee     internal feeContract;

    // ──────────────────────────────── Actors ─────────────────────────────────

    address internal alice   = makeAddr("alice");
    address internal bob     = makeAddr("bob");
    address internal charlie = makeAddr("charlie");
    address internal agent1Owner = makeAddr("agent1Owner");
    address internal agent2Owner = makeAddr("agent2Owner");
    address internal deployer;

    // ──────────────────────────────── Constants ───────────────────────────────

    uint256 internal constant INITIAL_USDC   = 100_000e6; // 100,000 USDC per user
    uint256 internal constant AGENT1_FEE_BPS = 1000;      // 10%
    uint256 internal constant AGENT2_FEE_BPS = 500;       // 5%

    // Stored agent IDs after registration
    uint256 internal agentId1;
    uint256 internal agentId2;

    // ─────────────────────────────────── Setup ────────────────────────────────

    function setUp() public {
        deployer = address(this);

        // ── Deploy contracts ────────────────────────────────────────────────
        usdc        = new MockUSDC();
        registry    = new AgentRegistry();
        feeContract = new PlatformFee(address(usdc));
        vault       = new DelegationVault(address(usdc), address(registry), address(feeContract));

        // ── Wire cross-contract references ─────────────────────────────────
        registry.setDelegationVault(address(vault));
        feeContract.setAuthorisedCaller(address(vault), true);

        // ── Mint USDC to test users ─────────────────────────────────────────
        usdc.mint(alice,      INITIAL_USDC);
        usdc.mint(bob,        INITIAL_USDC);
        usdc.mint(charlie,    INITIAL_USDC);
        usdc.mint(agent1Owner, INITIAL_USDC);
        usdc.mint(agent2Owner, INITIAL_USDC);

        // ── Register 2 agents ──────────────────────────────────────────────
        vm.prank(agent1Owner);
        agentId1 = registry.registerAgent(
            "AlphaBot",
            "Momentum breakout on USDC/CELO",
            "Ride short-term momentum shifts",
            AGENT1_FEE_BPS
        );

        vm.prank(agent2Owner);
        agentId2 = registry.registerAgent(
            "BetaBot",
            "Mean reversion USDC/WETH",
            "Capture spread compression",
            AGENT2_FEE_BPS
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    //                         A G E N T   R E G I S T R Y
    // ══════════════════════════════════════════════════════════════════════════

    // ─────────────────────── registerAgent ───────────────────────────────────

    function test_registerAgent_success() public {
        address newOwner = makeAddr("newOwner");
        vm.prank(newOwner);
        uint256 newId = registry.registerAgent("GammaBot", "Arb strategy", "Arb thesis", 200);

        assertEq(newId, 3, "agentId should be 3 (1 and 2 are taken)");

        IAgentRegistry.AgentInfo memory info = registry.getAgent(newId);
        assertEq(info.owner,       newOwner,    "owner mismatch");
        assertEq(info.name,        "GammaBot",  "name mismatch");
        assertEq(info.feePercent,  200,         "fee mismatch");
        assertTrue(info.isActive,               "should be active");
        assertEq(info.registeredAt, block.timestamp, "registeredAt mismatch");
        assertEq(info.totalTrades,  0,          "totalTrades should start at 0");
        assertEq(registry.getAgentIdByOwner(newOwner), newId, "ownerToAgentId mismatch");
    }

    function test_registerAgent_revert_alreadyRegistered() public {
        // agent1Owner already has agentId1
        vm.prank(agent1Owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAgentRegistry.AgentRegistry__AlreadyRegistered.selector,
                agent1Owner
            )
        );
        registry.registerAgent("Duplicate", "strat", "thesis", 100);
    }

    function test_registerAgent_revert_feeTooHigh() public {
        address newOwner = makeAddr("highFeeOwner");
        uint256 badFee = 2001; // max is 2000

        vm.prank(newOwner);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAgentRegistry.AgentRegistry__FeeTooHigh.selector,
                badFee,
                2000
            )
        );
        registry.registerAgent("GreedyBot", "strat", "thesis", badFee);
    }

    // ─────────────────────── deactivateAgent ─────────────────────────────────

    function test_deactivateAgent_success() public {
        vm.prank(agent1Owner);
        registry.deactivateAgent(agentId1);

        assertFalse(registry.isAgentActive(agentId1), "should be inactive");
    }

    function test_deactivateAgent_revert_notOwner() public {
        vm.prank(alice); // alice does not own agentId1
        vm.expectRevert(
            abi.encodeWithSelector(
                IAgentRegistry.AgentRegistry__NotAgentOwner.selector,
                alice,
                agentId1
            )
        );
        registry.deactivateAgent(agentId1);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //                       D E L E G A T I O N   V A U L T
    // ══════════════════════════════════════════════════════════════════════════

    // ─────────────────────────── deposit ─────────────────────────────────────

    function test_deposit_success() public {
        uint256 amount = 1000e6;
        _approveAndDeposit(alice, agentId1, amount);

        IDelegationVault.DelegatorPosition memory pos = vault.getPosition(agentId1, alice);
        assertEq(pos.principal, amount, "principal mismatch after deposit");

        IDelegationVault.AgentPool memory pool = vault.getPool(agentId1);
        assertEq(pool.totalPrincipal, amount, "totalPrincipal mismatch");

        assertEq(usdc.balanceOf(address(vault)), amount, "vault should hold USDC");
    }

    function test_deposit_revert_zeroAmount() public {
        vm.startPrank(alice);
        vm.expectRevert(IDelegationVault.DelegationVault__ZeroAmount.selector);
        vault.deposit(agentId1, 0);
        vm.stopPrank();
    }

    function test_deposit_revert_agentNotActive() public {
        // Deactivate agent1 first
        vm.prank(agent1Owner);
        registry.deactivateAgent(agentId1);

        vm.prank(alice);
        usdc.approve(address(vault), 1000e6);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                IDelegationVault.DelegationVault__AgentNotActive.selector,
                agentId1
            )
        );
        vault.deposit(agentId1, 1000e6);
    }

    // ─────────────────────────── withdraw ────────────────────────────────────

    function test_withdraw_success() public {
        uint256 depositAmt = 5000e6;
        uint256 withdrawAmt = 2000e6;

        _approveAndDeposit(alice, agentId1, depositAmt);

        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 expectFee  = feeContract.computeFee(withdrawAmt);
        uint256 feesBefore = feeContract.accumulatedFees();

        vm.prank(alice);
        vault.withdraw(agentId1, withdrawAmt);

        IDelegationVault.DelegatorPosition memory pos = vault.getPosition(agentId1, alice);
        assertEq(pos.principal, depositAmt - withdrawAmt, "principal after withdraw");
        assertEq(
            usdc.balanceOf(alice),
            aliceBefore + withdrawAmt - expectFee,
            "alice should receive net of platform fee"
        );
        assertEq(
            feeContract.accumulatedFees(),
            feesBefore + expectFee,
            "platform fee accumulated"
        );
    }

    function test_withdraw_revert_insufficientBalance() public {
        uint256 depositAmt = 500e6;
        _approveAndDeposit(alice, agentId1, depositAmt);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                IDelegationVault.DelegationVault__InsufficientBalance.selector,
                alice,
                agentId1,
                depositAmt,
                depositAmt + 1
            )
        );
        vault.withdraw(agentId1, depositAmt + 1);
    }

    // ─────────────────── distributeProfits ───────────────────────────────────

    function test_distributeProfits_success_correctSplit() public {
        uint256 depositAmt = 10_000e6;
        uint256 profit     = 1_000e6;

        _approveAndDeposit(alice, agentId1, depositAmt);

        // Agent operator approves and distributes profit
        vm.startPrank(agent1Owner);
        usdc.approve(address(vault), profit);
        vault.distributeProfits(agentId1, profit);
        vm.stopPrank();

        // Delegator (alice) should have 80% of profit pending
        uint256 expectedDelegatorShare = (profit * 8000) / 10_000; // 800 USDC
        uint256 pending = vault.pendingReward(agentId1, alice);
        assertEq(pending, expectedDelegatorShare, "delegator pending reward mismatch");

        // Operator should have 20% in operatorRewards
        IDelegationVault.AgentPool memory pool = vault.getPool(agentId1);
        uint256 expectedOperatorShare = profit - expectedDelegatorShare; // 200 USDC
        assertEq(pool.operatorRewards, expectedOperatorShare, "operator rewards mismatch");
    }

    function test_distributeProfits_revert_notAgentOwner() public {
        uint256 profit = 1000e6;

        vm.startPrank(alice); // alice is not agent owner
        usdc.approve(address(vault), profit);
        vm.expectRevert(
            abi.encodeWithSelector(
                IDelegationVault.DelegationVault__NotAgentOwner.selector,
                alice,
                agentId1
            )
        );
        vault.distributeProfits(agentId1, profit);
        vm.stopPrank();
    }

    // ─────────────────────── claimRewards ────────────────────────────────────

    function test_claimRewards_success() public {
        uint256 depositAmt = 10_000e6;
        uint256 profit     = 500e6;

        _approveAndDeposit(alice, agentId1, depositAmt);
        _distributeProfit(agent1Owner, agentId1, profit);

        uint256 pending = vault.pendingReward(agentId1, alice);
        assertGt(pending, 0, "should have pending rewards");

        uint256 aliceBefore = usdc.balanceOf(alice);

        vm.prank(alice);
        vault.claimRewards(agentId1);

        assertEq(usdc.balanceOf(alice), aliceBefore + pending, "alice should receive rewards");
        assertEq(vault.pendingReward(agentId1, alice), 0, "rewards should be zero after claim");
    }

    function test_claimRewards_revert_noRewards() public {
        // Alice deposits but no profits have been distributed
        _approveAndDeposit(alice, agentId1, 1000e6);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                IDelegationVault.DelegationVault__NoRewards.selector,
                alice,
                agentId1
            )
        );
        vault.claimRewards(agentId1);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //                          P L A T F O R M   F E E
    // ══════════════════════════════════════════════════════════════════════════

    function test_chargeFee_correctCalculation() public {
        uint256 tradeSize  = 1_000_000e6; // 1,000,000 USDC notional
        uint256 expectFee  = (tradeSize * 10) / 10_000; // 0.1% = 1,000 USDC

        // Mint directly to vault (simulate vault holding USDC for fee charging)
        usdc.mint(address(vault), tradeSize);

        // We need to call chargeFee from the DelegationVault (authorised).
        // In production this is called internally. For the unit test we impersonate vault.
        vm.startPrank(address(vault));
        usdc.approve(address(feeContract), tradeSize);
        uint256 fee = feeContract.chargeFee(agentId1, tradeSize);
        vm.stopPrank();

        assertEq(fee, expectFee, "fee amount mismatch");
        assertEq(feeContract.accumulatedFees(), expectFee, "accumulated fees mismatch");
    }

    function test_updateFeePercent_success() public {
        uint256 newFee = 50; // 0.5%
        feeContract.updateFeePercent(newFee);
        assertEq(feeContract.feePercent(), newFee, "fee percent not updated");
    }

    function test_updateFeePercent_revert_tooHigh() public {
        uint256 badFee = 1001; // max is 1000
        vm.expectRevert(
            abi.encodeWithSelector(
                IPlatformFee.PlatformFee__FeeTooHigh.selector,
                badFee,
                1000
            )
        );
        feeContract.updateFeePercent(badFee);
    }

    function test_withdrawFees_success() public {
        uint256 tradeSize = 100_000e6;
        uint256 expectFee = (tradeSize * 10) / 10_000;

        usdc.mint(address(vault), tradeSize);
        vm.startPrank(address(vault));
        usdc.approve(address(feeContract), tradeSize);
        feeContract.chargeFee(agentId1, tradeSize);
        vm.stopPrank();

        address treasury = makeAddr("treasury");
        feeContract.withdrawFees(treasury);

        assertEq(usdc.balanceOf(treasury), expectFee, "treasury should receive fees");
        assertEq(feeContract.accumulatedFees(), 0, "accumulated fees should reset");
    }

    // ══════════════════════════════════════════════════════════════════════════
    //                          I N T E G R A T I O N
    // ══════════════════════════════════════════════════════════════════════════

    function test_fullFlow_registerDepositProfitClaim() public {
        uint256 depositAmt = 20_000e6;
        uint256 profit     = 2_000e6;

        // Alice deposits into agentId1
        _approveAndDeposit(alice, agentId1, depositAmt);

        // Agent operator earns profit and distributes
        _distributeProfit(agent1Owner, agentId1, profit);

        // Alice claims rewards
        uint256 alicePending = vault.pendingReward(agentId1, alice);
        assertEq(alicePending, (profit * 8000) / 10_000, "incorrect delegator pending");

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        vault.claimRewards(agentId1);
        assertEq(usdc.balanceOf(alice), aliceBefore + alicePending, "alice reward claim");

        // Alice fully withdraws (platform fee is deducted from the gross principal)
        uint256 exitFee = feeContract.computeFee(depositAmt);
        vm.prank(alice);
        vault.withdraw(agentId1, depositAmt);
        assertEq(
            usdc.balanceOf(alice),
            aliceBefore + alicePending + depositAmt - exitFee,
            "alice full exit net of platform fee"
        );

        // Now alice is eligible to review
        vm.prank(alice);
        registry.submitReview(agentId1, 5, "Excellent alpha generation!");

        IAgentRegistry.AgentReview[] memory reviews = registry.getReviews(agentId1);
        assertEq(reviews.length, 1, "should have one review");
        assertEq(reviews[0].rating, 5, "review rating mismatch");
    }

    function test_multipleDelegators_correctProRataSplit() public {
        uint256 aliceDeposit   = 6_000e6; // 60% of pool
        uint256 bobDeposit     = 4_000e6; // 40% of pool
        uint256 totalPrincipal = aliceDeposit + bobDeposit;
        uint256 profit         = 1_000e6;

        _approveAndDeposit(alice, agentId1, aliceDeposit);
        _approveAndDeposit(bob,   agentId1, bobDeposit);

        _distributeProfit(agent1Owner, agentId1, profit);

        uint256 totalDelegatorShare = (profit * 8000) / 10_000; // 800 USDC
        uint256 aliceExpected = (totalDelegatorShare * aliceDeposit)  / totalPrincipal; // 480
        uint256 bobExpected   = (totalDelegatorShare * bobDeposit)    / totalPrincipal; // 320

        // Allow 1 wei of rounding tolerance due to integer division.
        assertApproxEqAbs(vault.pendingReward(agentId1, alice), aliceExpected, 1, "alice share");
        assertApproxEqAbs(vault.pendingReward(agentId1, bob),   bobExpected,   1, "bob share");
    }

    function test_reviewEligibility_onlyPastDelegators() public {
        // Charlie has never deposited — should not be able to review.
        vm.prank(charlie);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAgentRegistry.AgentRegistry__NotEligibleReviewer.selector,
                charlie,
                agentId1
            )
        );
        registry.submitReview(agentId1, 4, "Tried to review without delegating");

        // After depositing, charlie becomes eligible.
        _approveAndDeposit(charlie, agentId1, 100e6);

        vm.prank(charlie);
        registry.submitReview(agentId1, 4, "Good strategy");

        IAgentRegistry.AgentReview[] memory reviews = registry.getReviews(agentId1);
        assertEq(reviews.length, 1, "charlie's review should be stored");
        assertEq(reviews[0].reviewer, charlie, "reviewer mismatch");

        // Charlie cannot review the same agent twice.
        vm.prank(charlie);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAgentRegistry.AgentRegistry__AlreadyReviewed.selector,
                charlie,
                agentId1
            )
        );
        registry.submitReview(agentId1, 5, "Double review attempt");
    }

    // ══════════════════════════════════════════════════════════════════════════
    //                    A D D I T I O N A L   E D G E   C A S E S
    // ══════════════════════════════════════════════════════════════════════════

    function test_multipleDeposits_sameUser_accumulate() public {
        _approveAndDeposit(alice, agentId1, 3000e6);
        _approveAndDeposit(alice, agentId1, 2000e6);

        IDelegationVault.DelegatorPosition memory pos = vault.getPosition(agentId1, alice);
        assertEq(pos.principal, 5000e6, "principal should accumulate");
    }

    function test_deposit_afterProfit_doesNotEarnPastRewards() public {
        // Bob deposits and receives profit
        _approveAndDeposit(bob, agentId1, 10_000e6);
        _distributeProfit(agent1Owner, agentId1, 1_000e6);

        // Alice deposits AFTER profit is distributed
        _approveAndDeposit(alice, agentId1, 10_000e6);

        // Alice should have 0 pending (no rewards before her deposit)
        assertEq(vault.pendingReward(agentId1, alice), 0, "alice should not earn past rewards");

        // Bob's pending should be 80% of 1000 = 800 USDC
        assertEq(vault.pendingReward(agentId1, bob), 800e6, "bob pending mismatch");
    }

    function test_reactivateAgent_allowsDeposits() public {
        // Deactivate
        vm.prank(agent1Owner);
        registry.deactivateAgent(agentId1);

        // Reactivate
        vm.prank(agent1Owner);
        registry.reactivateAgent(agentId1);
        assertTrue(registry.isAgentActive(agentId1));

        // Deposit should now succeed
        _approveAndDeposit(alice, agentId1, 1000e6);
        assertEq(vault.getPosition(agentId1, alice).principal, 1000e6);
    }

    function test_operatorClaimRewards() public {
        _approveAndDeposit(alice, agentId1, 10_000e6);
        _distributeProfit(agent1Owner, agentId1, 1_000e6);

        uint256 expectedOperator = (1_000e6 * 2000) / 10_000; // 200 USDC
        IDelegationVault.AgentPool memory pool = vault.getPool(agentId1);
        assertEq(pool.operatorRewards, expectedOperator, "operator rewards mismatch");

        uint256 opBefore = usdc.balanceOf(agent1Owner);
        vm.prank(agent1Owner);
        vault.claimOperatorRewards(agentId1);

        assertEq(usdc.balanceOf(agent1Owner), opBefore + expectedOperator, "operator claim");
        assertEq(vault.getPool(agentId1).operatorRewards, 0, "operator rewards should clear");
    }

    function test_withdrawHarvestsRewards() public {
        uint256 depositAmt = 10_000e6;
        uint256 profit     = 1_000e6;

        _approveAndDeposit(alice, agentId1, depositAmt);
        _distributeProfit(agent1Owner, agentId1, profit);

        uint256 pending = vault.pendingReward(agentId1, alice);
        assertGt(pending, 0);

        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 expectFee = feeContract.computeFee(depositAmt);

        // Partial withdraw should also harvest pending rewards
        vm.prank(alice);
        vault.withdraw(agentId1, depositAmt);

        assertEq(
            usdc.balanceOf(alice),
            aliceBefore + depositAmt + pending - expectFee,
            "harvest on withdraw net of platform fee"
        );
        assertEq(vault.pendingReward(agentId1, alice), 0, "pending should be 0 after withdraw");
    }

    // ─────────────────────────────── Helpers ──────────────────────────────────

    /// @dev Approves vault and deposits USDC on behalf of `user`.
    function _approveAndDeposit(address user, uint256 agentId, uint256 amount) internal {
        vm.startPrank(user);
        usdc.approve(address(vault), amount);
        vault.deposit(agentId, amount);
        vm.stopPrank();
    }

    /// @dev Mints profit USDC to `operator`, approves vault, and calls distributeProfits.
    function _distributeProfit(address operator, uint256 agentId, uint256 amount) internal {
        usdc.mint(operator, amount);
        vm.startPrank(operator);
        usdc.approve(address(vault), amount);
        vault.distributeProfits(agentId, amount);
        vm.stopPrank();
    }
}
