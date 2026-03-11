import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

export interface StoredCredential {
  macaroon: string
  preimage: string
  paymentHash: string
  creditBalance: number | null
  storedAt: string
  lastUsed: string
  server: 'toll-booth' | null
}

export interface CredentialEntry extends StoredCredential {
  origin: string
}

export class CredentialStore {
  private data: Record<string, StoredCredential> = {}

  constructor(private readonly path: string) {
    this.load()
  }

  get(origin: string): StoredCredential | undefined {
    return this.data[origin]
  }

  set(origin: string, credential: StoredCredential): void {
    this.data[origin] = credential
    this.save()
  }

  updateBalance(origin: string, balance: number): void {
    const cred = this.data[origin]
    if (cred) {
      cred.creditBalance = balance
      cred.lastUsed = new Date().toISOString()
      this.save()
    }
  }

  updateLastUsed(origin: string): void {
    const cred = this.data[origin]
    if (cred) {
      cred.lastUsed = new Date().toISOString()
      this.save()
    }
  }

  list(): CredentialEntry[] {
    return Object.entries(this.data).map(([origin, cred]) => ({
      origin,
      ...cred,
    }))
  }

  count(): number {
    return Object.keys(this.data).length
  }

  private load(): void {
    try {
      if (existsSync(this.path)) {
        const raw = readFileSync(this.path, 'utf-8')
        this.data = JSON.parse(raw)
      }
    } catch {
      this.data = {}
    }
  }

  private save(): void {
    const dir = dirname(this.path)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(this.path, JSON.stringify(this.data, null, 2))
  }
}
