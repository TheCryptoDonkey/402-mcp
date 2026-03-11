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
})
