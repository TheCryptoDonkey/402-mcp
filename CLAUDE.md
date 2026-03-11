# CLAUDE.md - l402-mcp

L402 client MCP - AI agents discover, pay for, and consume any L402-gated API autonomously.

## Commands

```bash
npm run build       # tsc → build/
npm test            # vitest run
npm run typecheck   # tsc --noEmit
```

## Structure

```
src/
  index.ts              # Entry point: transport setup, tool registration
  config.ts             # Environment variable parsing, defaults
  tools/                # One file per MCP tool (handler + registration)
  wallet/               # Payment implementations (NWC, Cashu melt, human)
  store/                # Persistent JSON stores (credentials, Cashu tokens)
  l402/                 # L402 protocol utilities (parse, detect, cache, bolt11)
```

## Conventions

- **British English** - colour, initialise, behaviour, licence
- **ESM-only** - `"type": "module"`, target ES2022, module Node16
- **Git:** commit messages use `type: description` format
- **Git:** Do NOT include `Co-Authored-By` lines in commits
- **Tool pattern:** Each tool file exports a `handle*` function (testable) and a `register*Tool` function (MCP wiring)
- **Zero toll-booth dependency** - works with any L402 server
