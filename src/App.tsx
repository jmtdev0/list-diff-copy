import {
  ArrowRight,
  ClipboardCopy,
  Download,
  Eye,
  FileUp,
  ListChecks,
  RotateCcw,
  Sigma,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type DragEvent, type SelectHTMLAttributes } from 'react'
import './App.css'
import {
  DEFAULT_COMPARE_OPTIONS,
  compareLists,
  renderResultLines,
  type CaseTransform,
  type CompareOptions,
  type ListResultItem,
  type SortMode,
  type SplitMode,
} from './lib/listTools'
import { revealHiddenChars } from './lib/revealHidden'
import { countText } from './lib/textMetrics'

type TabId = 'compare' | 'counter' | 'hidden'
type ResultKey = 'aOnly' | 'inBoth' | 'bOnly' | 'allItems'

interface Preferences {
  splitMode: SplitMode
  options: CompareOptions
}

const PREFERENCES_KEY = 'list-diff-copy:preferences:v1'

const tabs: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: 'compare', label: 'Compare Two Lists', icon: ListChecks },
  { id: 'counter', label: 'Character Counter', icon: Sigma },
  { id: 'hidden', label: 'Reveal Hidden Characters', icon: Eye },
]

const splitModes: Array<{ value: SplitMode; label: string }> = [
  { value: 'line', label: 'Lines' },
  { value: 'comma', label: 'Comma' },
  { value: 'tab', label: 'Tab' },
  { value: 'semicolon', label: 'Semicolon' },
  { value: 'spaces', label: 'Spaces' },
]

const resultSections: Array<{ id: ResultKey; label: string; empty: string }> = [
  { id: 'aOnly', label: 'A Only', empty: 'No unique items in A' },
  { id: 'inBoth', label: 'In Both', empty: 'No shared items' },
  { id: 'bOnly', label: 'B Only', empty: 'No unique items in B' },
  { id: 'allItems', label: 'All Items', empty: 'No items yet' },
]

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: 'input', label: 'Input order' },
  { value: 'az', label: 'A to Z' },
  { value: 'za', label: 'Z to A' },
  { value: 'numeric', label: 'Numeric' },
]

const caseTransforms: Array<{ value: CaseTransform; label: string }> = [
  { value: 'none', label: 'Keep case' },
  { value: 'upper', label: 'UPPERCASE' },
  { value: 'lower', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
]

const relationshipMessages = {
  exact: 'Las listas A y B son exactamente iguales: mismos elementos en el mismo orden.',
  'same-items-different-order': 'Las listas A y B contienen los mismos elementos, pero en distinto orden.',
  'same-unique-items':
    'Ignorando duplicados, las listas A y B tienen los mismos elementos.',
} as const

function App() {
  const preferences = loadPreferences()
  const [activeTab, setActiveTab] = useState<TabId>('compare')
  const [listA, setListA] = useState('')
  const [listB, setListB] = useState('')
  const [splitMode, setSplitMode] = useState<SplitMode>(preferences.splitMode)
  const [options, setOptions] = useState<CompareOptions>(preferences.options)
  const [selectedResult, setSelectedResult] = useState<ResultKey>('aOnly')
  const [counterText, setCounterText] = useState('')
  const [counterSelection, setCounterSelection] = useState({ start: 0, end: 0 })
  const [hiddenText, setHiddenText] = useState('')

  useEffect(() => {
    savePreferences({ splitMode, options })
  }, [options, splitMode])

  const comparison = useMemo(
    () => compareLists(listA, listB, splitMode, options),
    [listA, listB, options, splitMode],
  )
  const selectedItems = comparison[selectedResult]
  const selectedOutput = renderResultLines(selectedItems, options.showLineNumbers)
  const metrics = useMemo(
    () => countText(counterText, counterSelection.start, counterSelection.end),
    [counterSelection.end, counterSelection.start, counterText],
  )
  const revealedText = useMemo(() => revealHiddenChars(hiddenText), [hiddenText])

  const updateOption = <K extends keyof CompareOptions>(key: K, value: CompareOptions[K]) => {
    setOptions((current) => ({ ...current, [key]: value }))
  }

  const resetCompare = () => {
    setListA('')
    setListB('')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local-first text tools</p>
          <h1>List Diff Copy</h1>
        </div>
      </header>

      <nav className="tabs" aria-label="Tools">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              className={activeTab === tab.id ? 'tab is-active' : 'tab'}
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {activeTab === 'compare' && (
        <section className="tool-section" aria-labelledby="compare-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Unique set comparison</p>
              <h2 id="compare-title">Compare Two Lists</h2>
            </div>
            <button className="icon-button" type="button" onClick={resetCompare} title="Clear both lists">
              <Trash2 size={18} aria-hidden="true" />
              <span>Clear</span>
            </button>
          </div>

          <p className="copy-notice">
            Esta página es una copia de{' '}
            <a href="https://listdiff.com/" rel="noreferrer" target="_blank">
              https://listdiff.com/
            </a>
            . La he copiado porque, si voy a introducir datos sensibles, prefiero hacerlo en una
            página que haya creado yo.
          </p>

          <div className="input-grid">
            <TextInputPanel
              id="list-a"
              label="List A"
              value={listA}
              onChange={setListA}
              onFileText={setListA}
              placeholder="Paste the first list here"
            />
            <TextInputPanel
              id="list-b"
              label="List B"
              value={listB}
              onChange={setListB}
              onFileText={setListB}
              placeholder="Paste the second list here"
            />
          </div>

          <div className="controls-band" aria-label="Comparison options">
            <div className="segmented" aria-label="Split mode">
              {splitModes.map((mode) => (
                <button
                  className={splitMode === mode.value ? 'segment is-active' : 'segment'}
                  key={mode.value}
                  type="button"
                  onClick={() => setSplitMode(mode.value)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="option-grid">
              <Toggle
                checked={options.caseSensitive}
                label="Case sensitive"
                onChange={(checked) => updateOption('caseSensitive', checked)}
              />
              <Toggle
                checked={options.trimEdges}
                label="Trim edges"
                onChange={(checked) => updateOption('trimEdges', checked)}
              />
              <Toggle
                checked={options.collapseSpaces}
                label="Collapse spaces"
                onChange={(checked) => updateOption('collapseSpaces', checked)}
              />
              <Toggle
                checked={options.ignoreLeadingZeros}
                label="Ignore leading zeros"
                onChange={(checked) => updateOption('ignoreLeadingZeros', checked)}
              />
              <Toggle
                checked={options.showLineNumbers}
                label="Line numbers"
                onChange={(checked) => updateOption('showLineNumbers', checked)}
              />
            </div>

            <div className="select-row">
              <LabeledSelect
                label="Sort"
                value={options.sortMode}
                onChange={(event) => updateOption('sortMode', event.target.value as SortMode)}
              >
                {sortOptions.map((sortOption) => (
                  <option key={sortOption.value} value={sortOption.value}>
                    {sortOption.label}
                  </option>
                ))}
              </LabeledSelect>
              <LabeledSelect
                label="Case"
                value={options.caseTransform}
                onChange={(event) => updateOption('caseTransform', event.target.value as CaseTransform)}
              >
                {caseTransforms.map((transform) => (
                  <option key={transform.value} value={transform.value}>
                    {transform.label}
                  </option>
                ))}
              </LabeledSelect>
            </div>
          </div>

          <div className="stats-strip" aria-label="Comparison counts">
            <Stat label="A items" value={comparison.counts.a} />
            <Stat label="A unique" value={comparison.counts.aUnique} />
            <Stat label="B items" value={comparison.counts.b} />
            <Stat label="B unique" value={comparison.counts.bUnique} />
            <Stat label="All unique" value={comparison.counts.allUnique} />
          </div>

          {comparison.relationship && (
            <p className="relationship-notice">{relationshipMessages[comparison.relationship]}</p>
          )}

          <div className="results-layout">
            <div className="result-tabs" aria-label="Result sections">
              {resultSections.map((section) => (
                <button
                  className={selectedResult === section.id ? 'result-tab is-active' : 'result-tab'}
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedResult(section.id)}
                >
                  <span>{section.label}</span>
                  <strong>{comparison[section.id].length}</strong>
                </button>
              ))}
            </div>

            <ResultPanel
              emptyLabel={resultSections.find((section) => section.id === selectedResult)?.empty ?? 'No items'}
              items={selectedItems}
              label={resultSections.find((section) => section.id === selectedResult)?.label ?? 'Results'}
              output={selectedOutput}
              showLineNumbers={options.showLineNumbers}
              onCopy={() => void copyText(selectedOutput)}
              onDownload={() => downloadText(selectedOutput, `${selectedResult}.txt`)}
              onSendA={() => setListA(selectedOutput)}
              onSendB={() => setListB(selectedOutput)}
            />
          </div>
        </section>
      )}

      {activeTab === 'counter' && (
        <section className="tool-section" aria-labelledby="counter-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Text size and selection</p>
              <h2 id="counter-title">Character Counter</h2>
            </div>
            <button className="icon-button" type="button" onClick={() => setCounterText('')} title="Clear text">
              <RotateCcw size={18} aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
          <textarea
            className="textarea tall"
            value={counterText}
            onChange={(event) => setCounterText(event.target.value)}
            onSelect={(event) =>
              setCounterSelection({
                start: event.currentTarget.selectionStart,
                end: event.currentTarget.selectionEnd,
              })
            }
            placeholder="Paste text to count"
            spellCheck="false"
          />
          <div className="stats-strip expanded">
            <Stat label="Characters" value={metrics.characters} />
            <Stat label="No spaces" value={metrics.charactersNoSpaces} />
            <Stat label="Words" value={metrics.words} />
            <Stat label="Lines" value={metrics.lines} />
            <Stat label="UTF-8 bytes" value={metrics.utf8Bytes} />
            <Stat label="Selected" value={metrics.selectedCharacters} />
          </div>
        </section>
      )}

      {activeTab === 'hidden' && (
        <section className="tool-section" aria-labelledby="hidden-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Whitespace and controls</p>
              <h2 id="hidden-title">Reveal Hidden Characters</h2>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() => void copyText(revealedText)}
              title="Copy revealed text"
            >
              <ClipboardCopy size={18} aria-hidden="true" />
              <span>Copy</span>
            </button>
          </div>
          <div className="input-grid">
            <label className="field">
              <span>Input</span>
              <textarea
                className="textarea tall"
                value={hiddenText}
                onChange={(event) => setHiddenText(event.target.value)}
                placeholder="Paste text with hidden characters"
                spellCheck="false"
              />
            </label>
            <div className="field">
              <span>Revealed</span>
              <pre className="output-block">{revealedText || 'Visible markers appear here'}</pre>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

function TextInputPanel({
  id,
  label,
  onChange,
  onFileText,
  placeholder,
  value,
}: {
  id: string
  label: string
  onChange: (value: string) => void
  onFileText: (value: string) => void
  placeholder: string
  value: string
}) {
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    const [file] = Array.from(event.dataTransfer.files)
    if (file) {
      void readFile(file).then(onFileText)
    }
  }

  return (
    <label
      className="field drop-field"
      htmlFor={id}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <span>{label}</span>
      <textarea
        className="textarea"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck="false"
      />
      <span className="file-row">
        <FileUp size={16} aria-hidden="true" />
        <span>Drop a text file or choose one</span>
        <input
          aria-label={`Choose file for ${label}`}
          type="file"
          accept=".txt,.csv,.tsv,.log,.md,text/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void readFile(file).then(onFileText)
            }
            event.currentTarget.value = ''
          }}
        />
      </span>
    </label>
  )
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="toggle">
      <input checked={checked} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function LabeledSelect({
  children,
  label,
  ...selectProps
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select {...selectProps}>{children}</select>
    </label>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
    </div>
  )
}

function ResultPanel({
  emptyLabel,
  items,
  label,
  onCopy,
  onDownload,
  onSendA,
  onSendB,
  output,
  showLineNumbers,
}: {
  emptyLabel: string
  items: ListResultItem[]
  label: string
  onCopy: () => void
  onDownload: () => void
  onSendA: () => void
  onSendB: () => void
  output: string
  showLineNumbers: boolean
}) {
  return (
    <section className="result-panel" aria-label={label}>
      <div className="result-toolbar">
        <h3>{label}</h3>
        <div className="button-cluster">
          <button className="icon-button" type="button" onClick={onCopy} title="Copy result">
            <ClipboardCopy size={17} aria-hidden="true" />
            <span>Copy</span>
          </button>
          <button className="icon-button" type="button" onClick={onDownload} title="Download result">
            <Download size={17} aria-hidden="true" />
            <span>Save</span>
          </button>
          <button className="icon-button" type="button" onClick={onSendA} title="Send result to List A">
            <ArrowRight size={17} aria-hidden="true" />
            <span>To A</span>
          </button>
          <button className="icon-button" type="button" onClick={onSendB} title="Send result to List B">
            <ArrowRight size={17} aria-hidden="true" />
            <span>To B</span>
          </button>
        </div>
      </div>
      <pre className="output-block result-output">
        {items.length === 0
          ? emptyLabel
          : items.map((item) => (
              <span className="output-line" key={item.key}>
                {showLineNumbers && <span className="line-number">{item.lineNumber}</span>}
                <span>{item.value}</span>
              </span>
            ))}
      </pre>
      <textarea aria-hidden="true" className="clipboard-shadow" readOnly value={output} tabIndex={-1} />
    </section>
  )
}

async function readFile(file: File): Promise<string> {
  return file.text()
}

async function copyText(text: string): Promise<void> {
  if (!text) {
    return
  }

  await navigator.clipboard.writeText(text)
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function loadPreferences(): Preferences {
  if (typeof window === 'undefined') {
    return { splitMode: 'line', options: DEFAULT_COMPARE_OPTIONS }
  }

  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY)
    if (!raw) {
      return { splitMode: 'line', options: DEFAULT_COMPARE_OPTIONS }
    }

    const parsed = JSON.parse(raw) as Partial<Preferences>
    return {
      splitMode: parsed.splitMode ?? 'line',
      options: { ...DEFAULT_COMPARE_OPTIONS, ...parsed.options },
    }
  } catch {
    return { splitMode: 'line', options: DEFAULT_COMPARE_OPTIONS }
  }
}

function savePreferences(preferences: Preferences) {
  try {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
  } catch {
    return
  }
}

export default App
