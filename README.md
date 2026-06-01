# List Diff Copy

Local-first tools for comparing lists and inspecting text without sending the
user's content anywhere after the app loads.

## Features

- Compare two lists with unique set semantics.
- Split by lines, commas, tabs, semicolons, or whitespace.
- Normalize case, edges, repeated spaces, and leading zeros.
- Count characters, words, lines, UTF-8 bytes, and selected text.
- Reveal spaces, tabs, line breaks, no-break spaces, zero-width characters, and
  common control characters.

## Local Development

```bash
npm install
npm run dev
```

## Quality Gates

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run e2e
```

## Kamehameha Local Model

Start LM Studio and load the local Qwen worker:

```powershell
npm run lmstudio:qwen
```

The script binds LM Studio to `127.0.0.1:1234`, loads
`qwen3.5-9b-deepseek-v4-flash`, and waits until `/api/v1/models` reports the
model as ready.

## Deployment

Netlify builds with:

- Build command: `npm run build`
- Publish directory: `dist`

The app is static and does all text processing in the browser. It uses
`localStorage` only for interface preferences, never for the lists or text that
users paste into the app.
