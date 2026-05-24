import { describe, expect, it } from 'vitest'
import { countText } from './textMetrics'

describe('countText', () => {
  it('counts practical text metrics', () => {
    expect(countText('Hello world\n🙂')).toEqual({
      characters: 13,
      charactersNoSpaces: 11,
      words: 3,
      lines: 2,
      utf8Bytes: 16,
      selectedCharacters: 0,
    })
  })

  it('counts selected characters with clamped ranges', () => {
    expect(countText('abcdef', 1, 4).selectedCharacters).toBe(3)
    expect(countText('abcdef', -10, 100).selectedCharacters).toBe(6)
  })

  it('handles empty text', () => {
    expect(countText('')).toEqual({
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      lines: 0,
      utf8Bytes: 0,
      selectedCharacters: 0,
    })
  })
})
