import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CredentialStore } from '../store/credentials.js'

const STALE_THRESHOLD_MS = 5 * 60 * 1000

export function handleBalance(args: { origin: string }, store: CredentialStore) {
  const cred = store.get(args.origin)

  if (!cred) {
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ error: `No stored credentials for ${args.origin}` }),
      }],
      isError: true as const,
    }
  }

  const lastUpdated = cred.lastUsed
  const stale = Date.now() - new Date(lastUpdated).getTime() > STALE_THRESHOLD_MS

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        origin: args.origin,
        creditsRemaining: cred.creditBalance,
        lastUpdated,
        stale,
      }, null, 2),
    }],
  }
}

export function registerBalanceTool(server: McpServer, store: CredentialStore): void {
  server.registerTool(
    'l402_balance',
    {
      description: 'Check cached credit balance for a server. Returns the last known balance from the credential store without making a network request. The "stale" flag is true if the balance was last updated more than 5 minutes ago.',
      inputSchema: {
        origin: z.url().describe('The server origin (e.g. https://api.example.com)'),
      },
    },
    async (args) => handleBalance(args, store),
  )
}
