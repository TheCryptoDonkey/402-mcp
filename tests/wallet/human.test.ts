import { describe, it, expect, vi } from 'vitest'
import { createHumanWallet, pollForSettlement } from '../../src/wallet/human.js'

describe('createHumanWallet', () => {
  it('returns awaitingHuman with QR data', async () => {
    const wallet = createHumanWallet({
      pollIntervalS: 1,
      timeoutS: 10,
      generateQr: async () => 'data:image/png;base64,test',
    })

    const result = await wallet.payInvoice('lnbc100n1test')
    expect(result.paid).toBe(false)
    expect(result.method).toBe('human')
    const data = JSON.parse(result.reason!)
    expect(data.awaitingHuman).toBe(true)
    expect(data.qrDataUri).toBe('data:image/png;base64,test')
  })
})

describe('pollForSettlement', () => {
  it('returns paid when settlement is confirmed', async () => {
    const checkSettlement = vi.fn()
      .mockResolvedValueOnce({ paid: false })
      .mockResolvedValueOnce({ paid: true, preimage: 'abc123' })

    const result = await pollForSettlement('hash123', {
      pollIntervalS: 0.01,
      timeoutS: 5,
      checkSettlement,
    })

    expect(result.paid).toBe(true)
    expect(result.preimage).toBe('abc123')
    expect(checkSettlement).toHaveBeenCalledTimes(2)
  })

  it('returns timeout when settlement is not confirmed in time', async () => {
    const checkSettlement = vi.fn().mockResolvedValue({ paid: false })

    const result = await pollForSettlement('hash123', {
      pollIntervalS: 0.01,
      timeoutS: 0.03,
      checkSettlement,
    })

    expect(result.paid).toBe(false)
    expect(result.reason).toBe('timeout')
  })
})
