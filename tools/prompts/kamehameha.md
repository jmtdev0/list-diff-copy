# Kamehameha Codex + Qwen Prompt Guide

Use Qwen for draft modules, edge-case brainstorming, and test generation. Codex
keeps final responsibility for review, integration, privacy, and deploy.

## Ground Rules

- The app is static and local-first.
- Do not add a backend, analytics, CDN dependency, tracking script, or runtime
  network call for user-provided text.
- Keep text/list data in React state only. `localStorage` may store preferences
  but never pasted list or text content.
- Prefer pure TypeScript utilities with Vitest coverage.
- Return concise code blocks or implementation notes, not chain-of-thought.

## Example

```bash
node tools/lmstudio-client.mjs \
  --prompt-file tools/prompts/kamehameha.md \
  --out tools/artifacts/qwen-answer.md \
  --save-raw tools/artifacts/qwen-raw.json
```
