export interface TextMetrics {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  utf8Bytes: number
  selectedCharacters: number
}

const encoder = new TextEncoder()

export function countText(
  text: string,
  selectionStart?: number,
  selectionEnd?: number,
): TextMetrics {
  const characters = Array.from(text).length
  const selected = getSelectedText(text, selectionStart, selectionEnd)

  return {
    characters,
    charactersNoSpaces: Array.from(text).filter((char) => !/\s/u.test(char)).length,
    words: text.trim().length === 0 ? 0 : text.trim().split(/\s+/u).length,
    lines: text.length === 0 ? 0 : text.split(/\r\n|\n|\r/u).length,
    utf8Bytes: encoder.encode(text).length,
    selectedCharacters: Array.from(selected).length,
  }
}

function getSelectedText(text: string, selectionStart?: number, selectionEnd?: number): string {
  if (selectionStart === undefined || selectionEnd === undefined) {
    return ''
  }

  const start = clamp(selectionStart, 0, text.length)
  const end = clamp(selectionEnd, start, text.length)
  return text.slice(start, end)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
