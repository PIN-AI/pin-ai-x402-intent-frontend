import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import axios from 'axios';
import { withPaymentInterceptor } from 'x402-axios';
import { config } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import Intent signing logic (local implementation)
import { signIntent, type IntentSignatureData } from '@/lib/intent-signature';
import { keccak256, concat, toBytes, bytesToHex } from 'viem';

export function IntentForm() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();  // For signing and x402 payment
  const publicClient = usePublicClient();
  const { open } = useAppKit();

  const [intentRaw, setIntentRaw] = useState('');
  const [status, setStatus] = useState<'idle' | 'signing' | 'submitting' | 'success' | 'error'>('idle');
  const [intentId, setIntentId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // If wallet is not connected or walletClient is not ready, open connection modal
    if (!isConnected || !address || !walletClient || !publicClient) {
      open();
      return;
    }

    // Validate input
    if (!intentRaw.trim()) {
      setError('Please enter your intent');
      setStatus('error');
      return;
    }

    setStatus('signing');
    setError('');
    setIntentId('');

    try {
      // 1. Calculate parameters hash
      const metadata = JSON.stringify({
        source: 'x402-frontend',
        timestamp: Date.now(),
      });

      const paramsHash = keccak256(
        concat([
          toBytes(intentRaw),
          toBytes(metadata)
        ])
      );

      // 2. Generate random Intent ID
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const intentId = bytesToHex(randomBytes);

      // 3. Calculate deadline
      const deadline = Math.floor(Date.now() / 1000) + config.defaultDeadlineOffset;

      // 4. Configure budget_token and amount (set to 0 for testing)
      const budgetToken = '0x0000000000000000000000000000000000000000';
      const amount = '0';

      // 5. Get actual signing address (using walletClient.account.address)
      const signerAddress = walletClient.account.address;
      console.log('[IntentForm] useAccount address:', address);
      console.log('[IntentForm] walletClient.account.address:', signerAddress);

      if (address.toLowerCase() !== signerAddress.toLowerCase()) {
        console.warn('[IntentForm] Address mismatch! Using walletClient.account.address');
      }

      // 6. Construct signature data (using walletClient.account.address)
      const signatureData: IntentSignatureData = {
        intent_id: intentId,
        subnet_id: config.subnetId,
        requester: signerAddress,  // ✅ Use actual signer address
        intent_type: config.defaultIntentType,
        params_hash: paramsHash,
        deadline: BigInt(deadline),
        payment_token: budgetToken,  // ✅ Use consistent value
        amount: BigInt(amount),      // ✅ Use consistent value
      };

      // 5. Sign Intent (using walletClient)
      console.log('[IntentForm] Signing intent...');
      console.log('[IntentForm] SignatureData:', {
        intent_id: intentId,
        subnet_id: config.subnetId,
        requester: signerAddress,
        intent_type: config.defaultIntentType,
        params_hash: paramsHash,
        deadline: deadline,
        payment_token: budgetToken,  // ✅ Show actual used value
        amount: amount,              // ✅ Show actual used value
        intentManager: config.intentManager,
        chainId: config.chainId,
      });

      const signature = await signIntent(
        {
          signMessage: async (bytes: Uint8Array) => {
            const hex = bytesToHex(bytes);
            console.log('[IntentForm] Digest to sign (hex):', hex);
            console.log('[IntentForm] Digest length (bytes):', bytes.length);

            // ✅ Directly call personal_sign RPC method
            // personal_sign automatically adds EIP-191 prefix: "\x19Ethereum Signed Message:\n32{bytes}"
            const sig = await walletClient.request({
              method: 'personal_sign',
              params: [hex, walletClient.account.address],
            });
            console.log('[IntentForm] Signature result:', sig);
            return sig;
          }
        },
        signatureData,
        config.intentManager,
        BigInt(config.chainId)
      );
      console.log('[IntentForm] Intent signed:', intentId);
      console.log('[IntentForm] Final signature:', signature);

      // 6. Submit using x402-axios (automatically handles HTTP 402 payment, using walletClient)
      setStatus('submitting');
      console.log('[IntentForm] Creating x402 axios client...');

      const api = withPaymentInterceptor(
        axios.create({
          baseURL: config.serverUrl,
        }),
        walletClient as any  // Use walletClient (with signTypedData)
      );

      console.log('[IntentForm] Submitting intent with x402 payment...');
      const requestBody = {
        intent_id: intentId,
        subnet_id: config.subnetId,
        requester: signerAddress,  // ✅ Use actual signer address
        intent_type: config.defaultIntentType,
        intent_raw: intentRaw,
        metadata,
        budget_token: budgetToken,  // ✅ Use consistent variable
        amount: amount,             // ✅ Use consistent variable
        deadline,
        signature,
        params_hash: paramsHash,
      };
      console.log('[IntentForm] Request body:', requestBody);

      const response = await api.post('/intent/submit', requestBody);

      console.log('[IntentForm] Success:', response.data);
      setIntentId(response.data.intent_id || intentId);
      setStatus('success');
      setIntentRaw(''); // Clear form
    } catch (err: any) {
      console.error('[IntentForm] Error:', err);
      setError(err.message || 'Unknown error occurred');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Submit Intent</CardTitle>
          <CardDescription>
            Enter your intent and submit with x402 payment protocol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Intent Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Intent Content
            </label>
            <Textarea
              value={intentRaw}
              onChange={(e) => setIntentRaw(e.target.value)}
              placeholder="What is the weather in San Francisco?"
              rows={6}
              disabled={status === 'signing' || status === 'submitting'}
              className="w-full"
            />
          </div>

          {/* Submit Button */}
          <div className="space-y-2">
            <Button
              onClick={handleSubmit}
              disabled={status === 'signing' || status === 'submitting'}
              className="w-full border-2 border-fuchsia-700 shadow-lg shadow-fuchsia-200/50 hover:shadow-xl hover:shadow-fuchsia-300/60 transition-all"
              size="lg"
            >
              {!isConnected && 'Connect Wallet to Submit'}
              {isConnected && status === 'idle' && 'Submit Intent'}
              {status === 'signing' && 'Signing with Wallet...'}
              {status === 'submitting' && 'Submitting Intent...'}
            </Button>
            <p className="text-center text-sm text-gray-500">
              💰 Payment: <span className="font-semibold text-fuchsia-600">{config.intentSubmitPrice}</span> via x402 Protocol
            </p>
          </div>

          {/* Success Alert */}
          {status === 'success' && (
            <Alert className="bg-fuchsia-50 border-fuchsia-200">
              <AlertDescription>
                <p className="font-medium text-fuchsia-800 mb-2">✅ Success!</p>
                <p className="text-sm text-fuchsia-700">
                  Intent ID:{' '}
                  <code className="bg-fuchsia-100 px-2 py-1 rounded font-mono text-xs">
                    {intentId}
                  </code>
                </p>
                <p className="text-sm text-fuchsia-600 mt-2">
                  Your intent has been submitted successfully!
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {status === 'error' && error && (
            <Alert className="bg-rose-50 border-rose-200">
              <AlertDescription>
                <p className="font-medium text-rose-800 mb-2">❌ Error</p>
                <p className="text-sm text-rose-700">{error}</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Info Card */}
          <Alert className="bg-purple-50 border-purple-200">
            <AlertDescription>
              <p className="font-medium text-purple-800 mb-2">💡 How it works</p>
              <ol className="text-sm text-purple-700 list-decimal list-inside space-y-1">
                <li>Connect your wallet and enter your intent</li>
                <li>Click "Submit Intent" to submit your intent</li>
                <li>Sign the intent with your wallet</li>
                <li>Sign the x402 payment with your wallet</li>
                <li>Your intent is submitted to the PIN AI Intent Subnet and executed</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
