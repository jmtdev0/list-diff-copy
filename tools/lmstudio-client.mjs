#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_URL = 'http://127.0.0.1:1234/api/v1/chat'
const DEFAULT_MODEL = 'qwen3.5-9b-deepseek-v4-flash'
const DEFAULT_SYSTEM_PROMPT = [
  'You are a local coding assistant helping Codex.',
  'Return production-ready code or concise implementation guidance.',
  'Do not include private chain-of-thought.',
  'Respect local-first privacy: no backend, analytics, CDN, or network calls for user text.',
].join(' ')

const args = parseArgs(process.argv.slice(2))
const prompt = await loadPrompt(args)

const response = await fetch(args.url ?? DEFAULT_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    model: args.model ?? DEFAULT_MODEL,
    input: prompt,
    system_prompt: args.system ?? DEFAULT_SYSTEM_PROMPT,
    temperature: Number(args.temperature ?? 0.2),
    top_p: Number(args.topP ?? 0.9),
    max_output_tokens: Number(args.maxOutputTokens ?? 16_384),
    store: false,
  }),
})

if (!response.ok) {
  throw new Error(`LM Studio request failed: ${response.status} ${await response.text()}`)
}

const payload = await response.json()
const message = payload.output
  ?.filter((item) => item.type === 'message')
  .map((item) => item.content)
  .join('\n')
  .trim()

if (args.saveRaw) {
  const rawPath = resolve(ROOT, args.saveRaw)
  await mkdir(dirname(rawPath), { recursive: true })
  await writeFile(rawPath, JSON.stringify(payload, null, 2), 'utf8')
}

if (args.out) {
  const outPath = resolve(ROOT, args.out)
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, `${message ?? ''}\n`, 'utf8')
} else {
  process.stdout.write(`${message ?? ''}\n`)
}

function parseArgs(argv) {
  const parsed = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith('--')) {
      continue
    }

    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    const value = argv[index + 1]
    if (value && !value.startsWith('--')) {
      parsed[key] = value
      index += 1
    } else {
      parsed[key] = true
    }
  }

  return parsed
}

async function loadPrompt(args) {
  if (args.promptFile) {
    return readFile(resolve(ROOT, args.promptFile), 'utf8')
  }

  if (args.prompt) {
    return args.prompt
  }

  const chunks = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }

  return Buffer.concat(chunks).toString('utf8')
}
