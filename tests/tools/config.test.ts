import { describe, it, expect } from 'vitest'
import { handleConfig } from '../../src/tools/config.js'

describe('handleConfig', () => {
  it('returns configuration state', () => {
    const result = handleConfig({
      nwcConfigured: true,
      cashuConfigured: false,
      cashuBalanceSats: 0,
      maxAutoPaySats: 1000,
      credentialCount: 3,
    })

    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.nwcConfigured).toBe(true)
    expect(parsed.cashuConfigured).toBe(false)
    expect(parsed.maxAutoPaySats).toBe(1000)
    expect(parsed.credentialCount).toBe(3)
  })
})
