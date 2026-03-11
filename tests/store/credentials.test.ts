import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { CredentialStore, type StoredCredential } from '../../src/store/credentials.js'

describe('CredentialStore', () => {
  let dir: string
  let store: CredentialStore

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'l402-test-'))
    store = new CredentialStore(join(dir, 'credentials.json'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  const cred: StoredCredential = {
    macaroon: 'mac123',
    preimage: 'pre123',
    paymentHash: 'hash123',
    creditBalance: 100,
    storedAt: '2026-03-11T10:00:00Z',
    lastUsed: '2026-03-11T10:00:00Z',
    server: 'toll-booth',
  }

  it('stores and retrieves a credential by origin', () => {
    store.set('https://api.example.com', cred)
    expect(store.get('https://api.example.com')).toEqual(cred)
  })

  it('returns undefined for unknown origin', () => {
    expect(store.get('https://unknown.com')).toBeUndefined()
  })

  it('replaces existing credential for same origin', () => {
    store.set('https://api.example.com', cred)
    const updated = { ...cred, creditBalance: 50 }
    store.set('https://api.example.com', updated)
    expect(store.get('https://api.example.com')?.creditBalance).toBe(50)
  })

  it('persists to disk and reloads', () => {
    store.set('https://api.example.com', cred)
    const store2 = new CredentialStore(join(dir, 'credentials.json'))
    expect(store2.get('https://api.example.com')).toEqual(cred)
  })

  it('lists all credentials', () => {
    store.set('https://a.com', cred)
    store.set('https://b.com', { ...cred, paymentHash: 'hash456' })
    const all = store.list()
    expect(all).toHaveLength(2)
  })

  it('counts credentials', () => {
    store.set('https://a.com', cred)
    store.set('https://b.com', cred)
    expect(store.count()).toBe(2)
  })

  it('creates parent directory if missing', () => {
    const deepPath = join(dir, 'sub', 'dir', 'creds.json')
    const deepStore = new CredentialStore(deepPath)
    deepStore.set('https://a.com', cred)
    expect(deepStore.get('https://a.com')).toEqual(cred)
  })
})
