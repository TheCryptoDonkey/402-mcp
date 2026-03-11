export type WalletMethod = 'nwc' | 'cashu' | 'human'

export interface PaymentResult {
  paid: boolean
  preimage?: string
  method: WalletMethod
  reason?: string
}

export interface WalletProvider {
  method: WalletMethod
  available: boolean
  payInvoice(invoice: string): Promise<PaymentResult>
}
