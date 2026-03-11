import { describe, it, expect } from 'vitest'
import { resolveWallet } from '../../src/wallet/resolve.js'
import type { WalletProvider } from '../../src/wallet/types.js'

describe('resolveWallet', () => {
  const mockNwc: WalletProvider = {
    method: 'nwc',
    available: true,
    payInvoice: async () => ({ paid: true, preimage: 'abc', method: 'nwc' }),
  }

  const mockCashu: WalletProvider = {
    method: 'cashu',
    available: true,
    payInvoice: async () => ({ paid: true, preimage: 'def', method: 'cashu' }),
  }

  const mockHuman: WalletProvider = {
    method: 'human',
    available: true,
    payInvoice: async () => ({ paid: true, preimage: 'ghi', method: 'human' }),
  }

  it('returns NWC first when available', () => {
    expect(resolveWallet([mockNwc, mockCashu, mockHuman])?.method).toBe('nwc')
  })

  it('falls back to Cashu when NWC unavailable', () => {
    const unavailable = { ...mockNwc, available: false }
    expect(resolveWallet([unavailable, mockCashu, mockHuman])?.method).toBe('cashu')
  })

  it('falls back to human when all wallets unavailable', () => {
    expect(resolveWallet([
      { ...mockNwc, available: false },
      { ...mockCashu, available: false },
      mockHuman,
    ])?.method).toBe('human')
  })

  it('returns specific method when requested', () => {
    expect(resolveWallet([mockNwc, mockCashu, mockHuman], 'cashu')?.method).toBe('cashu')
  })

  it('returns undefined when requested method is unavailable', () => {
    expect(resolveWallet([{ ...mockCashu, available: false }], 'cashu')).toBeUndefined()
  })
})
