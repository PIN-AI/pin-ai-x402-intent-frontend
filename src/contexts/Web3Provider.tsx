import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { baseSepolia } from '@reown/appkit/networks';
import { AppKitProvider } from '@reown/appkit/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useMemo } from 'react';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/config';

// Initialize AppKit + Wagmi adapter
const appNetworks = [baseSepolia] as unknown as [any, ...any[]];
const wagmiAdapter = new WagmiAdapter({
  networks: appNetworks,
  projectId: config.walletConnectProjectId,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: PropsWithChildren) {
  const qc = useMemo(() => queryClient, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <AppKitProvider
        projectId={config.walletConnectProjectId}
        adapters={[wagmiAdapter] as any}
        networks={appNetworks as any}
        defaultNetwork={baseSepolia as any}
        metadata={{
          name: 'PIN AI x402 Intent',
          description: 'Submit intents with x402 payment protocol',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://x402.pin.network',
          icons: ['https://pin.network/logo.svg'],
        }}
      >
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </AppKitProvider>
    </WagmiProvider>
  );
}
