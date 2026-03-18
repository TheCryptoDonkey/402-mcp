import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { handleBalance } from '../../src/tools/balance.js'
import { CredentialStore } from '../../src/store/credentials.js'

describe('handleBalance', () => {
  let dir: string
  let store: CredentialStore

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'l402-bal-test-'))
    store = new CredentialStore(join(dir, 'credentials.json'))
    store.set('https://a.com', {
      macaroon: 'mac1', preimage: 'pre1', paymentHash: 'h1',
      creditBalance: 100, storedAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(), server: 'toll-booth',
    })
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns cached balance for known origin', () => {
    const result = handleBalance({ origin: 'https://a.com' }, store)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.creditsRemaining).toBe(100)
    expect(parsed.stale).toBe(false)
  })

  it('returns error for unknown origin', () => {
    const result = handleBalance({ origin: 'https://unknown.com' }, store)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.error).toBeDefined()
  })

  it('marks balance as stale after 5 minutes', () => {
    const sixMinAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString()
    store.set('https://stale.com', {
      macaroon: 'mac', preimage: 'pre', paymentHash: 'h',
      creditBalance: 50, storedAt: sixMinAgo, lastUsed: sixMinAgo, server: null,
    })
    const result = handleBalance({ origin: 'https://stale.com' }, store)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.stale).toBe(true)
  })
})
