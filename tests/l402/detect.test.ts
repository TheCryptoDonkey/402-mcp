import { describe, it, expect } from 'vitest'
import { detectServer } from '../../src/l402/detect.js'

describe('detectServer', () => {
  it('detects toll-booth from X-Powered-By header', () => {
    const headers = new Headers({ 'x-powered-by': 'toll-booth' })
    expect(detectServer(headers, {})).toEqual({ type: 'toll-booth' })
  })

  it('detects toll-booth from response body shape', () => {
    const headers = new Headers()
    const body = { payment_url: '/pay', amount_sats: 10, payment_hash: 'abc' }
    expect(detectServer(headers, body)).toEqual({ type: 'toll-booth' })
  })

  it('returns generic for unknown server', () => {
    expect(detectServer(new Headers(), {})).toEqual({ type: 'generic' })
  })

  it('detects toll-booth from header even with unrelated body', () => {
    const headers = new Headers({ 'x-powered-by': 'toll-booth' })
    expect(detectServer(headers, { something: 'else' })).toEqual({ type: 'toll-booth' })
  })
})
