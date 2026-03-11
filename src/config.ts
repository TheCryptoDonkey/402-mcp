import { resolve } from 'node:path'
import { homedir } from 'node:os'

export interface L402Config {
  nwcUri: string | undefined
  cashuTokensPath: string | undefined
  maxAutoPaySats: number
  credentialStorePath: string
  transport: 'stdio' | 'http'
  port: number
  humanPayTimeoutS: number
  humanPayPollS: number
}

export function loadConfig(): L402Config {
  const defaultCredentialStore = resolve(homedir(), '.l402-mcp', 'credentials.json')

  return {
    nwcUri: process.env.NWC_URI,
    cashuTokensPath: process.env.CASHU_TOKENS,
    maxAutoPaySats: parseInt(process.env.MAX_AUTO_PAY_SATS ?? '1000', 10),
    credentialStorePath: process.env.CREDENTIAL_STORE ?? defaultCredentialStore,
    transport: (process.env.TRANSPORT ?? 'stdio') as 'stdio' | 'http',
    port: parseInt(process.env.PORT ?? '3402', 10),
    humanPayTimeoutS: parseInt(process.env.HUMAN_PAY_TIMEOUT_S ?? '600', 10),
    humanPayPollS: parseInt(process.env.HUMAN_PAY_POLL_S ?? '3', 10),
  }
}
