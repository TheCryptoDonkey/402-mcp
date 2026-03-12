import { describe, it, expect, beforeEach } from 'vitest'
import { ChallengeCache, type CachedChallenge } from '../../src/l402/challenge-cache.js'

describe('ChallengeCache', () => {
  let cache: ChallengeCache

  beforeEach(() => {
    cache = new ChallengeCache()
  })

  const challenge: CachedChallenge = {
    invoice: 'lnbc100n1...',
    macaroon: 'mac123',
    paymentHash: 'hash123',
    costSats: 10,
    expiresAt: Date.now() + 3600_000,
  }

  it('stores and retrieves a challenge by paymentHash', () => {
    cache.set(challenge)
    expect(cache.get('hash123')).toEqual(challenge)
  })

  it('returns undefined for unknown paymentHash', () => {
    expect(cache.get('unknown')).toBeUndefined()
  })

  it('returns undefined for expired challenge', () => {
    cache.set({ ...challenge, expiresAt: Date.now() - 1000 })
    expect(cache.get('hash123')).toBeUndefined()
  })

  it('removes a challenge', () => {
    cache.set(challenge)
    cache.delete('hash123')
    expect(cache.get('hash123')).toBeUndefined()
  })

  it('evicts oldest entries when cache exceeds max size', () => {
    for (let i = 0; i < 1010; i++) {
      cache.set({
        invoice: `lnbc${i}`,
        macaroon: `mac${i}`,
        paymentHash: `hash${i}`,
        costSats: 10,
        expiresAt: Date.now() + 3600_000,
      })
    }

    // Cache should be capped at 1000
    expect(cache.size).toBe(1000)

    // Oldest entries (0-9) should have been evicted
    for (let i = 0; i < 10; i++) {
      expect(cache.get(`hash${i}`)).toBeUndefined()
    }

    // Newest entries should still exist
    for (let i = 1005; i < 1010; i++) {
      expect(cache.get(`hash${i}`)).toBeDefined()
    }
  })

  it('evicts expired entries before evicting oldest', () => {
    // Fill with 999 expired entries and 1 valid
    for (let i = 0; i < 999; i++) {
      cache.set({
        invoice: `lnbc${i}`,
        macaroon: `mac${i}`,
        paymentHash: `expired${i}`,
        costSats: 10,
        expiresAt: Date.now() - 1000,
      })
    }
    cache.set({
      invoice: 'lnbc-valid',
      macaroon: 'mac-valid',
      paymentHash: 'valid-hash',
      costSats: 10,
      expiresAt: Date.now() + 3600_000,
    })

    // Adding one more should trigger expired eviction, not evict the valid entry
    cache.set({
      invoice: 'lnbc-new',
      macaroon: 'mac-new',
      paymentHash: 'new-hash',
      costSats: 10,
      expiresAt: Date.now() + 3600_000,
    })

    expect(cache.get('valid-hash')).toBeDefined()
    expect(cache.get('new-hash')).toBeDefined()
    expect(cache.size).toBe(2)
  })
})
