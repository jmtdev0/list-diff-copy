import { describe, expect, it } from 'vitest'
import { revealHiddenChars } from './revealHidden'

describe('revealHiddenChars', () => {
  it('marks common invisible characters', () => {
    expect(revealHiddenChars('a b\tc')).toBe('a·b⇥c')
    expect(revealHiddenChars('a\r\nb\nc\rd')).toBe('a␍␊\nb␊\nc␍d')
    expect(revealHiddenChars('x\u00A0y\u200Bz')).toBe('x[NBSP]y[ZWSP]z')
  })

  it('marks control characters', () => {
    expect(revealHiddenChars('a\u0007b\u007Fc')).toBe('a[U+0007]b[U+007F]c')
  })
})
