export interface CachedChallenge {
  invoice: string
  macaroon: string
  paymentHash: string
  costSats: number | null
  expiresAt: number
  url?: string
}

const MAX_CACHE_SIZE = 1000

export class ChallengeCache {
  private cache = new Map<string, CachedChallenge>()

  set(challenge: CachedChallenge): void {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.evictExpired()
    }

    if (this.cache.size >= MAX_CACHE_SIZE) {
      // Evict oldest entry (first key in insertion order)
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(challenge.paymentHash, challenge)
  }

  get(paymentHash: string): CachedChallenge | undefined {
    const entry = this.cache.get(paymentHash)
    if (!entry) return undefined

    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(paymentHash)
      return undefined
    }

    return entry
  }

  delete(paymentHash: string): void {
    this.cache.delete(paymentHash)
  }

  get size(): number {
    return this.cache.size
  }

  private evictExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}
