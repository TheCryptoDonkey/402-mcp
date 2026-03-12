import { describe, it, expect, beforeEach } from 'vitest'
import { ChallengeCache, type CachedChallenge } from '../../src/l402/challenge-cache.js'

/** Generate a valid 64-char hex payment hash from an index. */
function hexHash(n: number): string {
  return n.toString(16).padStart(64, '0')
}

describe('ChallengeCache', () => {
  let cache: ChallengeCache

  beforeEach(() => {
    cache = new ChallengeCache()
  })

  const HASH = hexHash(123)

  const challenge: CachedChallenge = {
    invoice: 'lnbc100n1...',
    macaroon: 'mac123',
    paymentHash: HASH,
    costSats: 10,
    expiresAt: Date.now() + 3600_000,
  }

  it('stores and retrieves a challenge by paymentHash', () => {
    cache.set(challenge)
    expect(cache.get(HASH)).toEqual(challenge)
  })

  it('returns undefined for unknown paymentHash', () => {
    expect(cache.get('unknown')).toBeUndefined()
  })

  it('returns undefined for expired challenge', () => {
    cache.set({ ...challenge, expiresAt: Date.now() - 1000 })
    expect(cache.get(HASH)).toBeUndefined()
  })

  it('removes a challenge', () => {
    cache.set(challenge)
    cache.delete(HASH)
    expect(cache.get(HASH)).toBeUndefined()
  })

  it('evicts oldest entries when cache exceeds max size', () => {
    for (let i = 0; i < 1010; i++) {
      cache.set({
        invoice: `lnbc${i}`,
        macaroon: `mac${i}`,
        paymentHash: hexHash(i),
        costSats: 10,
        expiresAt: Date.now() + 3600_000,
      })
    }

    // Cache should be capped at 1000
    expect(cache.size).toBe(1000)

    // Oldest entries (0-9) should have been evicted
    for (let i = 0; i < 10; i++) {
      expect(cache.get(hexHash(i))).toBeUndefined()
    }

    // Newest entries should still exist
    for (let i = 1005; i < 1010; i++) {
      expect(cache.get(hexHash(i))).toBeDefined()
    }
  })

  it('evicts expired entries before evicting oldest', () => {
    // Fill with 999 expired entries and 1 valid
    for (let i = 0; i < 999; i++) {
      cache.set({
        invoice: `lnbc${i}`,
        macaroon: `mac${i}`,
        paymentHash: hexHash(10000 + i),
        costSats: 10,
        expiresAt: Date.now() - 1000,
      })
    }
    const validHash = hexHash(99999)
    cache.set({
      invoice: 'lnbc-valid',
      macaroon: 'mac-valid',
      paymentHash: validHash,
      costSats: 10,
      expiresAt: Date.now() + 3600_000,
    })

    // Adding one more should trigger expired eviction, not evict the valid entry
    const newHash = hexHash(88888)
    cache.set({
      invoice: 'lnbc-new',
      macaroon: 'mac-new',
      paymentHash: newHash,
      costSats: 10,
      expiresAt: Date.now() + 3600_000,
    })

    expect(cache.get(validHash)).toBeDefined()
    expect(cache.get(newHash)).toBeDefined()
    expect(cache.size).toBe(2)
  })

  it('rejects invalid payment hashes', () => {
    cache.set({ ...challenge, paymentHash: 'not-hex' })
    expect(cache.size).toBe(0)

    cache.set({ ...challenge, paymentHash: '' })
    expect(cache.size).toBe(0)

    cache.set({ ...challenge, paymentHash: 'ab'.repeat(16) }) // 32 chars, too short
    expect(cache.size).toBe(0)
  })
})
