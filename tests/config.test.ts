import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('config validation', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('throws on negative MAX_AUTO_PAY_SATS', async () => {
    vi.stubEnv('MAX_AUTO_PAY_SATS', '-100')
    const { loadConfig } = await import('../src/config.js')
    expect(() => loadConfig()).toThrow('MAX_AUTO_PAY_SATS')
    expect(() => loadConfig()).toThrow('positive integer')
  })

  it('throws on non-numeric MAX_AUTO_PAY_SATS', async () => {
    vi.stubEnv('MAX_AUTO_PAY_SATS', 'abc')
    const { loadConfig } = await import('../src/config.js')
    expect(() => loadConfig()).toThrow('MAX_AUTO_PAY_SATS')
  })

  it('throws on PORT out of range', async () => {
    vi.stubEnv('PORT', '99999')
    const { loadConfig } = await import('../src/config.js')
    expect(() => loadConfig()).toThrow('PORT')
  })

  it('throws on PORT = 0', async () => {
    vi.stubEnv('PORT', '0')
    const { loadConfig } = await import('../src/config.js')
    expect(() => loadConfig()).toThrow('PORT')
  })

  it('throws on negative FETCH_TIMEOUT_MS', async () => {
    vi.stubEnv('FETCH_TIMEOUT_MS', '-1')
    const { loadConfig } = await import('../src/config.js')
    expect(() => loadConfig()).toThrow('FETCH_TIMEOUT_MS')
  })

  it('accepts FETCH_MAX_RETRIES = 0', async () => {
    vi.stubEnv('FETCH_MAX_RETRIES', '0')
    const { loadConfig } = await import('../src/config.js')
    expect(() => loadConfig()).not.toThrow()
  })

  it('throws on negative FETCH_MAX_RETRIES', async () => {
    vi.stubEnv('FETCH_MAX_RETRIES', '-1')
    const { loadConfig } = await import('../src/config.js')
    expect(() => loadConfig()).toThrow('FETCH_MAX_RETRIES')
  })

  it('accepts valid defaults (no env vars set)', async () => {
    const { loadConfig } = await import('../src/config.js')
    expect(() => loadConfig()).not.toThrow()
  })
})
