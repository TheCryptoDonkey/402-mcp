import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { handleCredentials } from '../../src/tools/credentials.js'
import { CredentialStore } from '../../src/store/credentials.js'

describe('handleCredentials', () => {
  let dir: string
  let store: CredentialStore

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'l402-cred-test-'))
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

  it('returns credentials without sensitive fields', () => {
    const result = handleCredentials(store)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.credentials).toHaveLength(1)
    expect(parsed.credentials[0].origin).toBe('https://a.com')
    expect(parsed.credentials[0].creditBalance).toBe(100)
    // Should not expose macaroon or preimage
    expect(parsed.credentials[0].macaroon).toBeUndefined()
    expect(parsed.credentials[0].preimage).toBeUndefined()
  })
})
