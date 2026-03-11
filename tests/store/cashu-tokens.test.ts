import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { CashuTokenStore, type StoredToken } from '../../src/store/cashu-tokens.js'

describe('CashuTokenStore', () => {
  let dir: string
  let store: CashuTokenStore

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'l402-cashu-test-'))
    store = new CashuTokenStore(join(dir, 'tokens.json'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  const token: StoredToken = {
    token: 'cashuAey...',
    mint: 'https://mint.example.com',
    amountSats: 100,
    addedAt: '2026-03-11T09:00:00Z',
  }

  it('starts empty', () => {
    expect(store.list()).toEqual([])
    expect(store.totalBalance()).toBe(0)
  })

  it('adds and lists tokens', () => {
    store.add(token)
    expect(store.list()).toHaveLength(1)
  })

  it('returns total balance', () => {
    store.add(token)
    store.add({ ...token, amountSats: 50 })
    expect(store.totalBalance()).toBe(150)
  })

  it('consumes first token (FIFO)', () => {
    store.add({ ...token, amountSats: 100 })
    store.add({ ...token, token: 'second', amountSats: 50 })
    const consumed = store.consumeFirst()
    expect(consumed?.amountSats).toBe(100)
    expect(store.list()).toHaveLength(1)
    expect(store.list()[0].token).toBe('second')
  })

  it('returns undefined when consuming from empty store', () => {
    expect(store.consumeFirst()).toBeUndefined()
  })

  it('persists to disk', () => {
    store.add(token)
    const store2 = new CashuTokenStore(join(dir, 'tokens.json'))
    expect(store2.list()).toHaveLength(1)
  })

  it('removes a specific token', () => {
    store.add(token)
    store.add({ ...token, token: 'second' })
    store.remove('cashuAey...')
    expect(store.list()).toHaveLength(1)
    expect(store.list()[0].token).toBe('second')
  })
})
