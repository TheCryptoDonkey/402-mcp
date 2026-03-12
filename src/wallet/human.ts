import type { WalletProvider, PaymentResult } from './types.js'

export interface HumanWalletOptions {
  pollIntervalS: number
  timeoutS: number
  generateQr: (invoice: string) => Promise<string>
}

export function createHumanWallet(options: HumanWalletOptions): WalletProvider {
  return {
    method: 'human',
    available: true,

    async payInvoice(invoice: string): Promise<PaymentResult> {
      const qrDataUri = await options.generateQr(invoice)

      return {
        paid: false,
        method: 'human',
        reason: JSON.stringify({
          awaitingHuman: true,
          invoice,
          qrDataUri,
          expiresIn: options.timeoutS,
          message: 'Pay this invoice from your wallet. Polling for settlement...',
        }),
      }
    },
  }
}

export interface PollOptions {
  pollIntervalS: number
  timeoutS: number
  checkSettlement: (paymentHash: string) => Promise<{ paid: boolean; preimage?: string }>
}

export async function pollForSettlement(
  paymentHash: string,
  options: PollOptions,
): Promise<PaymentResult> {
  const deadline = Date.now() + options.timeoutS * 1000

  while (Date.now() < deadline) {
    const result = await options.checkSettlement(paymentHash)
    if (result.paid) {
      return { paid: true, preimage: result.preimage, method: 'human' }
    }
    await new Promise(resolve => setTimeout(resolve, options.pollIntervalS * 1000))
  }

  return { paid: false, method: 'human', reason: 'timeout' }
}
