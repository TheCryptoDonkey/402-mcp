import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export interface ConfigState {
  nwcConfigured: boolean
  cashuConfigured: boolean
  cashuBalanceSats: number
  maxAutoPaySats: number
  credentialCount: number
}

export function handleConfig(state: ConfigState) {
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify(state, null, 2),
    }],
  }
}

export function registerConfigTool(
  server: McpServer,
  getState: () => ConfigState,
): void {
  server.registerTool(
    'l402_config',
    {
      description: 'Introspect the MCP\'s payment capabilities: which wallets are configured, spending limits, and stored credential count. Call this first to understand what payment methods are available.',
      inputSchema: {},
    },
    async () => handleConfig(getState()),
  )
}
