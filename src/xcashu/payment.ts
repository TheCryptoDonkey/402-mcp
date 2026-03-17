import type { CashuTokenStore, StoredToken } from '../store/cashu-tokens.js'
import type { XCashuChallenge } from './parse.js'

export interface XCashuPaymentResult {
  /** The cashuB token to send in the X-Cashu header */
  header: string
  /** Amount in sats that the token covers */
  amountSats: number
}

/**
 * Attempts to construct a Cashu ecash payment for an xcashu challenge.
 * Returns null if no matching tokens or insufficient balance.
 * On failure after consuming tokens, restores them to the store.
 */
export async function attemptXCashuPayment(opts: {
  challenge: XCashuChallenge
  tokenStore: CashuTokenStore
}): Promise<XCashuPaymentResult | null> {
  const { challenge, tokenStore } = opts

  // Find tokens from an accepted mint with sufficient balance
  let matchingTokens: StoredToken[] = []
  let matchedMint: string | null = null
  for (const mint of challenge.mints) {
    const tokens = tokenStore.listByMint(mint)
    const balance = tokens.reduce((sum, t) => sum + t.amountSats, 0)
    if (balance >= challenge.amount) {
      matchingTokens = tokens
      matchedMint = mint
      break
    }
  }

  if (!matchedMint || matchingTokens.length === 0) return null

  // Remove tokens from store (we'll restore on failure)
  tokenStore.removeTokens(matchingTokens)

  try {
    const { Wallet, getDecodedToken, getEncodedTokenV4 } = await import('@cashu/cashu-ts')

    // Decode and aggregate proofs from all matching tokens
    const allProofs: Array<{ id: string; amount: number; secret: string; C: string }> = []
    for (const t of matchingTokens) {
      const decoded = getDecodedToken(t.token)
      if (decoded.proofs) allProofs.push(...decoded.proofs)
    }

    // Coin selection — split to exact amount needed
    const wallet = new Wallet(matchedMint, { unit: challenge.unit })
    const { send, keep } = await wallet.send(challenge.amount, allProofs, { includeFees: true })

    // Restore change proofs to store
    if (keep.length > 0) {
      const keepTotal = keep.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
      if (keepTotal > 0) {
        const encoded = getEncodedTokenV4({ mint: matchedMint, proofs: keep })
        tokenStore.add({
          token: encoded,
          mint: matchedMint,
          amountSats: keepTotal,
          addedAt: new Date().toISOString(),
        })
      }
    }

    // Encode payment token
    const paymentToken = getEncodedTokenV4({ mint: matchedMint, proofs: send })
    const paymentAmount = send.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)

    return { header: paymentToken, amountSats: paymentAmount }
  } catch {
    // Restore tokens on failure — proofs may still be valid if error was before wallet.send()
    for (const t of matchingTokens) {
      tokenStore.add(t)
    }
    return null
  }
}
