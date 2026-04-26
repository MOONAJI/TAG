import { http, createConfig } from "wagmi";
import { celo, mainnet } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

// Re-export the canonical Celo mainnet definition under the historic
// `monadTestnet` name so existing imports keep working without a sweep.
// Everything in the app now points at Celo mainnet (chainId 42220) and
// uses native CELO + native USDC.
export const celoMainnet = celo;

export const config = createConfig({
  chains: [celo, mainnet],
  connectors: [injected(), metaMask()],
  transports: {
    [celo.id]: http("https://forno.celo.org"),
    [mainnet.id]: http(),
  },
});
