import { describe, it, expect, vi } from 'vitest'
import { handlePay } from '../../src/tools/pay.js'
import { ChallengeCache } from '../../src/l402/challenge-cache.js'

describe('handlePay', () => {
  it('pays an invoice and stores credential', async () => {
    const mockWallet = {
      method: 'nwc' as const,
      available: true,
      payInvoice: vi.fn().mockResolvedValue({ paid: true, preimage: 'abc', method: 'nwc' }),
    }
    const storeCredential = vi.fn()

    const result = await handlePay(
      { invoice: 'lnbc...', macaroon: 'mac123', paymentHash: 'hash123' },
      {
        cache: new ChallengeCache(),
        resolveWallet: () => mockWallet,
        storeCredential,
        maxAutoPaySats: 1000,
      },
    )

    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.paid).toBe(true)
    expect(parsed.preimage).toBe('abc')
    expect(storeCredential).toHaveBeenCalled()
  })

  it('uses cached challenge when paymentHash matches', async () => {
    const cache = new ChallengeCache()
    cache.set({
      invoice: 'cached-invoice',
      macaroon: 'cached-mac',
      paymentHash: 'hash123',
      costSats: 10,
      expiresAt: Date.now() + 3600_000,
    })

    const mockWallet = {
      method: 'nwc' as const,
      available: true,
      payInvoice: vi.fn().mockResolvedValue({ paid: true, preimage: 'abc', method: 'nwc' }),
    }

    await handlePay(
      { paymentHash: 'hash123' },
      {
        cache,
        resolveWallet: () => mockWallet,
        storeCredential: vi.fn(),
        maxAutoPaySats: 1000,
      },
    )

    expect(mockWallet.payInvoice).toHaveBeenCalledWith('cached-invoice')
  })

  it('returns error when no wallet available', async () => {
    const result = await handlePay(
      { invoice: 'lnbc...', macaroon: 'mac123', paymentHash: 'hash123' },
      {
        cache: new ChallengeCache(),
        resolveWallet: () => undefined,
        storeCredential: vi.fn(),
        maxAutoPaySats: 1000,
      },
    )

    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.paid).toBe(false)
    expect(parsed.reason).toContain('No wallet')
  })
})
