import type { X402Challenge } from './parse.js'
import { buildPaymentDeeplink } from './parse.js'

/** Format the x402 challenge as a human-readable payment request for the agent to present. */
export function formatX402PaymentRequest(challenge: X402Challenge): {
  /** Structured JSON for the agent to parse. */
  json: Record<string, unknown>
  /** Human-readable summary. */
  message: string
} {
  const deeplink = buildPaymentDeeplink(challenge)

  const json: Record<string, unknown> = {
    status: 402,
    protocol: 'x402',
    receiver: challenge.receiver,
    network: challenge.network,
    asset: challenge.asset.toUpperCase(),
    amountUsd: challenge.amountUsd,
    ...(challenge.chainId !== null ? { chainId: challenge.chainId } : {}),
    ...(deeplink ? { paymentDeeplink: deeplink } : {}),
    message: `Payment required: $${challenge.amountUsd} ${challenge.asset.toUpperCase()} on ${challenge.network}. `
      + `Send to ${challenge.receiver}. `
      + `After payment, provide the transaction hash to retry the request.`,
  }

  return {
    json,
    message: json.message as string,
  }
}

/** Validate a transaction hash format (0x-prefixed hex, 32 bytes). */
export function isValidTxHash(hash: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(hash)
}
