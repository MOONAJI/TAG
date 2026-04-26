import { createConfig, http } from "wagmi";
import { celo, mainnet } from "wagmi/chains";

const celoMainnet = celo;

export const config = createConfig({
  chains: [celoMainnet, mainnet],
  transports: {
    [celoMainnet.id]: http(
      process.env.NEXT_PUBLIC_CELO_RPC_URL ?? "https://forno.celo.org",
    ),
    [mainnet.id]: http(),
  },
});
