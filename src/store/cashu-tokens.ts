import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

export interface StoredToken {
  token: string
  mint: string
  amountSats: number
  addedAt: string
}

interface TokenStoreData {
  tokens: StoredToken[]
}

export class CashuTokenStore {
  private data: TokenStoreData = { tokens: [] }

  constructor(private readonly path: string) {
    this.load()
  }

  list(): StoredToken[] {
    return [...this.data.tokens]
  }

  totalBalance(): number {
    return this.data.tokens.reduce((sum, t) => sum + t.amountSats, 0)
  }

  add(token: StoredToken): void {
    this.data.tokens.push(token)
    this.save()
  }

  consumeFirst(): StoredToken | undefined {
    const token = this.data.tokens.shift()
    if (token) this.save()
    return token
  }

  remove(tokenStr: string): void {
    this.data.tokens = this.data.tokens.filter(t => t.token !== tokenStr)
    this.save()
  }

  private load(): void {
    try {
      if (existsSync(this.path)) {
        const raw = readFileSync(this.path, 'utf-8')
        this.data = JSON.parse(raw)
        if (!Array.isArray(this.data.tokens)) {
          this.data = { tokens: [] }
        }
      }
    } catch {
      this.data = { tokens: [] }
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
