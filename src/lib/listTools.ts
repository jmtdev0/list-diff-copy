export type SplitMode = 'line' | 'comma' | 'tab' | 'semicolon' | 'spaces'
export type SortMode = 'input' | 'az' | 'za' | 'numeric'
export type CaseTransform = 'none' | 'upper' | 'lower' | 'capitalize'

export interface CompareOptions {
  caseSensitive: boolean
  trimEdges: boolean
  collapseSpaces: boolean
  ignoreLeadingZeros: boolean
  showLineNumbers: boolean
  sortMode: SortMode
  caseTransform: CaseTransform
}

export interface ListResultItem {
  key: string
  value: string
  lineNumber: number
}

export interface CompareResult {
  aOnly: ListResultItem[]
  inBoth: ListResultItem[]
  bOnly: ListResultItem[]
  allItems: ListResultItem[]
  counts: {
    a: number
    b: number
    aUnique: number
    bUnique: number
    allUnique: number
  }
}

export const DEFAULT_COMPARE_OPTIONS: CompareOptions = {
  caseSensitive: true,
  trimEdges: true,
  collapseSpaces: false,
  ignoreLeadingZeros: false,
  showLineNumbers: false,
  sortMode: 'input',
  caseTransform: 'none',
}

export function splitItems(text: string, mode: SplitMode): string[] {
  if (!text) {
    return []
  }

  if (mode === 'line') {
    return text.split(/\r\n|\n|\r/)
  }

  if (mode === 'comma') {
    return text.split(',')
  }

  if (mode === 'tab') {
    return text.split('\t')
  }

  if (mode === 'semicolon') {
    return text.split(';')
  }

  return text.trim().length === 0 ? [] : text.trim().split(/\s+/u)
}

export function normalizeItem(value: string, options: CompareOptions): string {
  return normalizeCore(value, options, true)
}

export function makeDisplayValue(value: string, options: CompareOptions): string {
  const normalized = normalizeCore(value, options, false)
  return applyCaseTransform(normalized, options.caseTransform)
}

export function compareLists(
  aText: string,
  bText: string,
  splitMode: SplitMode,
  options: CompareOptions,
): CompareResult {
  const aItems = buildUniqueItems(aText, splitMode, options)
  const bItems = buildUniqueItems(bText, splitMode, options)
  const aKeys = new Set(aItems.map((item) => item.key))
  const bKeys = new Set(bItems.map((item) => item.key))

  const aOnly = aItems.filter((item) => !bKeys.has(item.key))
  const inBoth = aItems.filter((item) => bKeys.has(item.key))
  const bOnly = bItems.filter((item) => !aKeys.has(item.key))
  const allItems = [...aItems, ...bItems.filter((item) => !aKeys.has(item.key))]

  return {
    aOnly: sortItems(aOnly, options.sortMode),
    inBoth: sortItems(inBoth, options.sortMode),
    bOnly: sortItems(bOnly, options.sortMode),
    allItems: sortItems(allItems, options.sortMode),
    counts: {
      a: splitItems(aText, splitMode).filter((item) => normalizeItem(item, options).length > 0).length,
      b: splitItems(bText, splitMode).filter((item) => normalizeItem(item, options).length > 0).length,
      aUnique: aItems.length,
      bUnique: bItems.length,
      allUnique: allItems.length,
    },
  }
}

export function renderResultLines(items: ListResultItem[], showLineNumbers: boolean): string {
  return items
    .map((item) => (showLineNumbers ? `${item.lineNumber}: ${item.value}` : item.value))
    .join('\n')
}

function buildUniqueItems(
  text: string,
  splitMode: SplitMode,
  options: CompareOptions,
): ListResultItem[] {
  const items = splitItems(text, splitMode)
  const unique = new Map<string, ListResultItem>()

  items.forEach((rawItem, index) => {
    const key = normalizeItem(rawItem, options)
    if (key.length === 0 || unique.has(key)) {
      return
    }

    unique.set(key, {
      key,
      value: makeDisplayValue(rawItem, options),
      lineNumber: index + 1,
    })
  })

  return [...unique.values()]
}

function normalizeCore(value: string, options: CompareOptions, forKey: boolean): string {
  let normalized = value

  if (options.trimEdges) {
    normalized = normalized.trim()
  }

  if (options.collapseSpaces) {
    normalized = normalized.replace(/[ \t]+/gu, ' ')
  }

  if (options.ignoreLeadingZeros) {
    normalized = normalized.replace(/^([+-]?)0+(?=\d+$)/u, '$1')
  }

  if (forKey && !options.caseSensitive) {
    normalized = normalized.toLocaleLowerCase()
  }

  return normalized
}

function applyCaseTransform(value: string, transform: CaseTransform): string {
  if (transform === 'upper') {
    return value.toLocaleUpperCase()
  }

  if (transform === 'lower') {
    return value.toLocaleLowerCase()
  }

  if (transform === 'capitalize') {
    return value
      .split(/(\s+)/u)
      .map((part) => {
        if (/^\s+$/u.test(part) || part.length === 0) {
          return part
        }

        const [first = '', ...rest] = Array.from(part)
        return `${first.toLocaleUpperCase()}${rest.join('').toLocaleLowerCase()}`
      })
      .join('')
  }

  return value
}

function sortItems(items: ListResultItem[], sortMode: SortMode): ListResultItem[] {
  if (sortMode === 'input') {
    return items
  }

  const sorted = [...items]
  sorted.sort((left, right) => {
    if (sortMode === 'numeric') {
      const leftNumber = toStrictNumber(left.value)
      const rightNumber = toStrictNumber(right.value)

      if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) {
        return leftNumber - rightNumber
      }

      if (leftNumber !== null && rightNumber === null) {
        return -1
      }

      if (leftNumber === null && rightNumber !== null) {
        return 1
      }
    }

    const direction = sortMode === 'za' ? -1 : 1
    return direction * left.value.localeCompare(right.value, undefined, { numeric: true })
  })

  return sorted
}

function toStrictNumber(value: string): number | null {
  if (!/^[+-]?(?:\d+|\d+\.\d+|\.\d+)$/u.test(value.trim())) {
    return null
  }

  return Number(value)
}
