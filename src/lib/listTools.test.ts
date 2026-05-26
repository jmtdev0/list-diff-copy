import { describe, expect, it } from 'vitest'
import {
  DEFAULT_COMPARE_OPTIONS,
  compareLists,
  normalizeItem,
  renderResultLines,
  splitItems,
  type CompareOptions,
} from './listTools'

const options: CompareOptions = { ...DEFAULT_COMPARE_OPTIONS }

describe('splitItems', () => {
  it('splits by common delimiters', () => {
    expect(splitItems('a\r\nb\nc\rd', 'line')).toEqual(['a', 'b', 'c', 'd'])
    expect(splitItems('a,b,c', 'comma')).toEqual(['a', 'b', 'c'])
    expect(splitItems('a\tb', 'tab')).toEqual(['a', 'b'])
    expect(splitItems('a;b', 'semicolon')).toEqual(['a', 'b'])
    expect(splitItems(' a   b\tc ', 'spaces')).toEqual(['a', 'b', 'c'])
  })
})

describe('normalizeItem', () => {
  it('applies comparison normalization', () => {
    const normalized = normalizeItem('  00042   A\t\tB  ', {
      ...options,
      caseSensitive: false,
      collapseSpaces: true,
      ignoreLeadingZeros: true,
    })

    expect(normalized).toBe('00042 a b')
  })

  it('ignores leading zeros for numeric values', () => {
    expect(normalizeItem('00042', { ...options, ignoreLeadingZeros: true })).toBe('42')
    expect(normalizeItem('000', { ...options, ignoreLeadingZeros: true })).toBe('0')
    expect(normalizeItem('-00042', { ...options, ignoreLeadingZeros: true })).toBe('-42')
    expect(normalizeItem('00042A', { ...options, ignoreLeadingZeros: true })).toBe('00042A')
  })
})

describe('compareLists', () => {
  it('compares unique sets and ignores blank normalized items', () => {
    const result = compareLists('apple\nbanana\nbanana\n\ncarrot', 'banana\ndate\napple', 'line', options)

    expect(result.aOnly.map((item) => item.value)).toEqual(['carrot'])
    expect(result.inBoth.map((item) => item.value)).toEqual(['apple', 'banana'])
    expect(result.bOnly.map((item) => item.value)).toEqual(['date'])
    expect(result.allItems.map((item) => item.value)).toEqual(['apple', 'banana', 'carrot', 'date'])
    expect(result.counts).toEqual({ a: 4, b: 3, aUnique: 3, bUnique: 3, allUnique: 4 })
  })

  it('supports case-insensitive matching while preserving display from A', () => {
    const result = compareLists('Alpha\nBeta', 'alpha\ngamma', 'line', {
      ...options,
      caseSensitive: false,
    })

    expect(result.inBoth.map((item) => item.value)).toEqual(['Alpha'])
    expect(result.bOnly.map((item) => item.value)).toEqual(['gamma'])
  })

  it('sorts result sections numerically', () => {
    const result = compareLists('10\n2\nx', '3', 'line', {
      ...options,
      sortMode: 'numeric',
    })

    expect(result.allItems.map((item) => item.value)).toEqual(['2', '3', '10', 'x'])
  })

  it('identifies lists with the same normalized items in the same order', () => {
    const result = compareLists('apple\nbanana', 'apple\nbanana', 'line', options)

    expect(result.relationship).toBe('exact')
  })

  it('identifies lists with the same normalized items in a different order', () => {
    const result = compareLists('apple\nbanana\napple', 'banana\napple\napple', 'line', options)

    expect(result.relationship).toBe('same-items-different-order')
  })

  it('identifies lists that only match after ignoring duplicates', () => {
    const result = compareLists('apple\nbanana\nbanana', 'banana\napple', 'line', options)

    expect(result.relationship).toBe('same-unique-items')
  })

  it('renders optional line numbers', () => {
    const result = compareLists('alpha\nbeta', 'beta', 'line', options)

    expect(renderResultLines(result.aOnly, true)).toBe('1: alpha')
  })
})
