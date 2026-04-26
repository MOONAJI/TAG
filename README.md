# TAG — Trade Agent

> **AI Agent Hedge Fund Marketplace, on Celo mainnet, settled in native USDC.**

TAG (Trade Agent) adalah marketplace on-chain untuk **AI trading agent**. Pengguna ("delegator") menitipkan modal USDC ke vault, lalu memilih agent AI yang menjalankan strategi trading otomatis. Profit dibagi pro-rata; semua catatan reputasi, fee, dan AUM tersimpan transparan di smart contract Celo mainnet.

Tidak ada custodian, tidak ada off-chain ledger. Yang kamu lihat di explorer = posisi sebenarnya.

---

## 🎯 Untuk siapa TAG ini?

| Kalau kamu adalah… | TAG buat kamu apa |
| --- | --- |
| **Delegator** (pemodal pasif) | Pilih agent dari leaderboard, deposit USDC sekali klik, klaim profit kapan saja. Withdraw kapan saja — tidak ada lockup. |
| **Agent Operator** (developer strategi AI) | Daftarkan bot trading kamu, set fee operator (max 20%), kumpulkan AUM dari delegator dan ambil bagian profit. |
| **Researcher / Pengamat** | Baca leaderboard publik: 30-day return, Sharpe, AUM, win rate, trade count — semuanya on-chain. |

---

## 🏗️ Arsitektur Singkat

```
        ┌─────────────────────────────────────────────┐
        │             FE (Next.js + wagmi)            │
        │   Dashboard · Leaderboard · Top-Up · News   │
        └────────────────┬────────────────────────────┘
                         │ reads/writes
        ┌────────────────▼────────────────────────────┐
        │     Celo Mainnet (chainId 42220)            │
        │                                             │
        │  ┌────────────────┐   ┌──────────────────┐  │
        │  │ AgentRegistry  │◄──┤ DelegationVault  │  │
        │  │  (identity,    │   │  (deposit/with-  │  │
        │  │   reviews,     │   │   draw, profit   │  │
        │  │   reputation)  │   │   accounting)    │  │
        │  └────────────────┘   └────────┬─────────┘  │
        │                                │            │
        │                       ┌────────▼─────────┐  │
        │                       │   PlatformFee    │  │
        │                       │  (0.1% per-trade)│  │
        │                       └──────────────────┘  │
        │                                             │
        │           Native USDC (Circle)              │
        │  0xcebA9300f2b948710d2653dD7B07f33A8B32118C │
        └─────────────────────────────────────────────┘
                         ▲
                         │ price feeds, off-chain stats
        ┌────────────────┴────────────────────────────┐
        │              BE (Next.js API)               │
        │   Mock Chainlink, agent metadata, news      │
        └─────────────────────────────────────────────┘
```

### Layout repo

```
TAG/
├── SC/   # Smart contracts (Foundry · Solidity 0.8.24)
├── FE/   # Frontend (Next.js 16 · wagmi · Tailwind v4)
└── BE/   # Backend (Next.js API · viem)
```

---

## 📜 Kontrak — Celo Mainnet (42220)

| Kontrak | Address | Fungsi |
| --- | --- | --- |
| **AgentRegistry** | [`0x13cA51F693A1635B5181F98f0B23a065357F9b30`](https://celoscan.io/address/0x13cA51F693A1635B5181F98f0B23a065357F9b30) | Identitas agent, fee, reputasi, review |
| **DelegationVault** | [`0x9470E359871996C31632f1496572B0B29B5a2FA0`](https://celoscan.io/address/0x9470E359871996C31632f1496572B0B29B5a2FA0) | Deposit/withdraw USDC, distribusi profit |
| **PlatformFee** | [`0x2907d7E6922C4e4D4C05E95d0Bb451d6C615ca06`](https://celoscan.io/address/0x2907d7E6922C4e4D4C05E95d0Bb451d6C615ca06) | Pungutan protokol 0.1% per-trade |
| **USDC** (native Circle) | [`0xcebA9300f2b948710d2653dD7B07f33A8B32118C`](https://celoscan.io/address/0xcebA9300f2b948710d2653dD7B07f33A8B32118C) | Settlement asset (6 decimals) |

### Seed agents

| Agent | id | Strategi |
| --- | --- | --- |
| **TAG FX Agent** | `1` | Momentum / carry pada synthetic FX pair |
| **TAG Yield Agent** | `2` | Auto-compound LP positions di DEX Celo |

---

## 💰 Flow Penggunaan

### Sebagai Delegator

1. **Connect wallet** — pastikan ke Celo mainnet (chainId 42220).
2. **Punya USDC** — bridge / swap / onramp ke wallet kamu (TAG **tidak punya faucet** karena pakai USDC Circle asli).
3. **Klik "Top Up"** di dashboard, pilih agent (FX / Yield), masukkan jumlah.
4. Wallet akan minta 2 tx: **approve** vault, lalu **deposit**. Setelah itu kamu jadi delegator.
5. **Pantau pending rewards** secara real-time. Klaim atau biarkan compound.
6. **Withdraw kapan saja** — vault kembalikan principal + harvest pending rewards. Platform fee 0.1% dipotong dari principal.

### Sebagai Agent Operator

1. Panggil `AgentRegistry.registerAgent(name, strategy, thesis, feePercent)` (max fee 2000 bps = 20%).
2. Jalankan strategi off-chain → settle PnL on-chain via `DelegationVault.distributeProfits(agentId, amount)`.
3. Split otomatis: **80% delegator (pro-rata principal), 20% operator**.
4. Klaim porsi operator: `claimOperatorRewards(agentId)`.

---

## ⚙️ Mekanika Profit (Reward-per-share)

Vault pakai pola **MasterChef-style accumulator**:

```
accRewardPerShare += (delegatorShare × 1e12) / totalPrincipal
pending = (principal × accRewardPerShare / 1e12) − rewardDebt
```

- Tidak ada lockup, tidak ada epoch boundary — settle terus-menerus.
- Deposit baru tidak ikut menerima profit yang sudah dibagikan sebelumnya (`rewardDebt` di-snapshot saat deposit).
- Withdraw otomatis harvest pending reward dalam tx yang sama.
- Kalau pool kosong saat distribusi profit, semua share masuk ke operator (anti-loss).

---

## 🎨 Brand

- **Nama**: TAG (singkatan dari **T**rade **A**gent)
- **Aksen warna**: neon yellow (`oklch(0.94 0.22 110)` ≈ `#E8FF00`)
- **Tema**: dark-first, mono `Geist`, layout institusional

---

## 🚀 Run Lokal

### Smart Contract

```bash
cd SC
cp .env.example .env        # isi PRIVATE_KEY, CELO_RPC_URL
forge install
forge test                  # 26/26 pass
forge script script/Deploy.s.sol \
  --rpc-url $CELO_RPC_URL --broadcast --legacy -vv
```

### Frontend

```bash
cd FE
pnpm install
pnpm dev                    # http://localhost:3000
```

`FE/lib/contracts.ts` sudah pre-loaded dengan address mainnet di atas. Untuk swap chain (mis. fork lokal), edit `FE/lib/wagmi.ts`.

### Backend

```bash
cd BE
pnpm install
pnpm dev                    # http://localhost:3001
```

FE mem-proxy `/api/be/*` ke BE via Next.js rewrite (lihat `FE/next.config.mjs`).

---

## 🔒 Catatan Keamanan

- Semua state-changing function dilindungi `ReentrancyGuard` + Checks-Effects-Interactions.
- Token transfer pakai `SafeERC20` (`forceApprove` untuk reset allowance).
- Akses kontrol: `Ownable` untuk admin, modifier `onlyDelegationVault` / `onlyAuthorised` untuk panggilan internal.
- Cap fee: operator max 20%, platform max 10%.
- Native USDC = no admin mint, no upgradability surprise.

**Belum diaudit profesional** — ini adalah implementasi referensi. Gunakan dengan risiko sendiri di mainnet.

---

## 📄 Lisensi

MIT
