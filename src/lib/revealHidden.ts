const ZERO_WIDTH_MARKERS = new Map<string, string>([
  ['\u200B', '[ZWSP]'],
  ['\u200C', '[ZWNJ]'],
  ['\u200D', '[ZWJ]'],
  ['\u2060', '[WORD-JOINER]'],
  ['\uFEFF', '[BOM]'],
])

export function revealHiddenChars(text: string): string {
  let output = ''

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '\r' && next === '\n') {
      output += '␍␊\n'
      index += 1
      continue
    }

    output += revealChar(char)
  }

  return output
}

function revealChar(char: string): string {
  if (char === ' ') {
    return '·'
  }

  if (char === '\t') {
    return '⇥'
  }

  if (char === '\n') {
    return '␊\n'
  }

  if (char === '\r') {
    return '␍'
  }

  if (char === '\u00A0') {
    return '[NBSP]'
  }

  const zeroWidth = ZERO_WIDTH_MARKERS.get(char)
  if (zeroWidth) {
    return zeroWidth
  }

  const codePoint = char.codePointAt(0) ?? 0
  if (codePoint < 32 || codePoint === 127) {
    return `[U+${codePoint.toString(16).toLocaleUpperCase().padStart(4, '0')}]`
  }

  return char
}
