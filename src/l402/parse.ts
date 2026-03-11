export interface L402Challenge {
  macaroon: string
  invoice: string
}

export function parseL402Challenge(header: string): L402Challenge | null {
  const match = header.match(/^(?:L402|LSAT)\s+(.+)$/i)
  if (!match) return null

  const params = match[1]

  const macaroonMatch = params.match(/macaroon="?([^",\s]+)"?/)
  const invoiceMatch = params.match(/invoice="?([^",\s]+)"?/)

  if (!macaroonMatch || !invoiceMatch) return null

  return {
    macaroon: macaroonMatch[1],
    invoice: invoiceMatch[1],
  }
}
