import { baseSepolia } from 'viem/chains';

export const config = {
  // WalletConnect
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID!,

  // Server
  // Leave empty in development to use Vite proxy (to avoid CORS)
  serverUrl: import.meta.env.VITE_SERVER_URL || '',

  // Contract addresses
  intentManager: (import.meta.env.VITE_INTENT_MANAGER || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`,
  subnetId: (import.meta.env.VITE_SUBNET_ID || '0x0000000000000000000000000000000000000000000000000000000000000000') as `0x${string}`,
  usdcAddress: (import.meta.env.VITE_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`,

  // Chain
  chain: baseSepolia,
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '84532'),

  // Intent defaults
  defaultIntentType: 'llm_query',
  defaultAmount: '1000000', // 1 USDC (6 decimals)
  defaultDeadlineOffset: 3600, // 1 hour (in seconds)
  
  // x402 Payment pricing (must match server configuration)
  intentSubmitPrice: '$0.01', // Price for submitting an intent via x402 protocol
} as const;

// Validate required configs
if (!config.walletConnectProjectId) {
  throw new Error(
    'Missing VITE_WALLETCONNECT_PROJECT_ID. Get one at https://cloud.reown.com/'
  );
}

console.log('[Config] Loaded:', {
  serverUrl: config.serverUrl,
  chainId: config.chainId,
  intentManager: config.intentManager,
});
