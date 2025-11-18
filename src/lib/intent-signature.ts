import { keccak256, concat, toBytes, type Hex } from 'viem';

/**
 * Intent signature data structure matching IntentManager.sol
 */
export interface IntentSignatureData {
    intent_id: string;
    subnet_id: string;
    requester: string;
    intent_type: string;
    params_hash: string;
    deadline: bigint;
    payment_token: string;
    amount: bigint;
}

/**
 * Intent type hash for EIP-191 signature verification
 * Matches IntentManager.sol PIN_INTENT_V1 signature
 */
const TYPE_HASH_INTENT = keccak256(
    toBytes('PIN_INTENT_V1(bytes32,bytes32,address,bytes32,bytes32,uint256,address,uint256,address,uint256)')
);

/**
 * Generate intent digest for signing using viem (instead of ethers)
 * @param data Intent signature data
 * @param verifyingContract IntentManager contract address
 * @param chainId Chain ID
 * @returns Digest bytes32 hex string
 */
export function generateIntentDigest(
    data: IntentSignatureData,
    verifyingContract: string,
    chainId: bigint
): Hex {
    // Encode parameters using viem's concat
    const encoded = concat([
        TYPE_HASH_INTENT,
        data.intent_id as Hex,
        data.subnet_id as Hex,
        leftPad(data.requester as Hex),
        keccak256(toBytes(data.intent_type)),
        data.params_hash as Hex,
        leftPad(toHex(data.deadline)),
        leftPad(data.payment_token as Hex),
        leftPad(toHex(data.amount)),
        leftPad(verifyingContract as Hex),
        leftPad(toHex(chainId)),
    ]);

    return keccak256(encoded);
}

/**
 * Sign intent digest with wallet
 * @param signer Signer with signMessage method
 * @param data Intent signature data
 * @param verifyingContract IntentManager contract address
 * @param chainId Chain ID
 * @returns Signature hex string
 */
export async function signIntent(
    signer: { signMessage: (bytes: Uint8Array) => Promise<string> },
    data: IntentSignatureData,
    verifyingContract: string,
    chainId: bigint
): Promise<string> {
    const digest = generateIntentDigest(data, verifyingContract, chainId);
    const bytes = toBytes(digest);
    return signer.signMessage(bytes);
}

/**
 * Left-pad a hex string to 32 bytes (64 hex chars + 0x prefix)
 */
function leftPad(hex: Hex): Hex {
    const stripped = hex.replace(/^0x/, '');
    return `0x${stripped.padStart(64, '0')}` as Hex;
}

/**
 * Convert bigint to hex string
 */
function toHex(value: bigint): Hex {
    return `0x${value.toString(16)}` as Hex;
}
