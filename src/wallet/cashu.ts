import type { WalletProvider, PaymentResult } from './types.js'
import type { CashuTokenStore } from '../store/cashu-tokens.js'

export function createCashuWallet(tokenStore: CashuTokenStore): WalletProvider {
  return {
    method: 'cashu',
    get available() {
      return tokenStore.totalBalance() > 0
    },

    async payInvoice(invoice: string): Promise<PaymentResult> {
      const token = tokenStore.consumeFirst()
      if (!token) {
        return { paid: false, method: 'cashu', reason: 'No Cashu tokens available' }
      }

      try {
        const { CashuMint, CashuWallet, getDecodedToken } = await import('@cashu/cashu-ts')
        const mint = new CashuMint(token.mint)
        const wallet = new CashuWallet(mint)

        // Decode the token to get proofs
        const decoded = getDecodedToken(token.token)
        const proofs = decoded.token[0]?.proofs ?? []

        // Melt proofs to pay the Lightning invoice
        const meltQuote = await wallet.createMeltQuote(invoice)
        const meltResponse = await wallet.meltProofs(meltQuote, proofs)

        if (meltResponse.quote.paid) {
          return {
            paid: true,
            preimage: meltResponse.quote.payment_preimage ?? undefined,
            method: 'cashu',
          }
        } else {
          // Payment failed; re-add the token since it wasn't spent
          tokenStore.add(token)
          return { paid: false, method: 'cashu', reason: 'Cashu melt failed' }
        }
      } catch (err) {
        // On error, re-add the token (it may not have been spent)
        tokenStore.add(token)
        return { paid: false, method: 'cashu', reason: String(err) }
      }
    },
  }
}
