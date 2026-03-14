import type { NostrEvent } from 'nostr-tools/core'
import type { SearchDeps } from './search.js'

/**
 * Creates a Nostr relay subscriber that connects to relays,
 * subscribes to the given event kinds, and collects events
 * for a specified timeout period.
 */
export function createNostrSubscriber(): SearchDeps['subscribeEvents'] {
  return async (relays: string[], kinds: number[], timeout: number): Promise<NostrEvent[]> => {
    const { Relay } = await import('nostr-tools/relay')
    const events: NostrEvent[] = []
    const connections: Array<{ close(): void }> = []

    const settled = await Promise.allSettled(
      relays.map(async (url) => {
        try {
          const relay = await Relay.connect(url)
          connections.push(relay)

          return new Promise<void>((resolve) => {
            const sub = relay.subscribe(
              [{ kinds }],
              {
                onevent: (event) => {
                  events.push(event as NostrEvent)
                },
                oneose: () => {
                  sub.close()
                  resolve()
                },
              },
            )

            // Ensure we resolve even if EOSE never arrives
            setTimeout(() => {
              sub.close()
              resolve()
            }, timeout)
          })
        } catch {
          // Skip unreachable relays silently
        }
      }),
    )

    // Close all relay connections
    for (const conn of connections) {
      try {
        conn.close()
      } catch {
        // Ignore close errors
      }
    }

    // Deduplicate by event id
    const seen = new Set<string>()
    return events.filter((e) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })
  }
}
