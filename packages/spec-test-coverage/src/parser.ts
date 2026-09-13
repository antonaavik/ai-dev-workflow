// The single module coupled to OpenSpec's markdown shape and our conventions
// (`[S<n>]` / `[INV<n>]` id markers, `[waived: reason]`). Everything else
// consumes the parsed model below.

export type ItemKind = 'scenario' | 'invariant'
export type DeltaOp = 'ADDED' | 'MODIFIED' | 'REMOVED' | 'RENAMED' | 'PRESENT'

export interface SpecItem {
  kind: ItemKind
  capability: string
  requirement: string
  /** e.g. `S1` or `INV1`, or null when the header carries no marker. */
  marker: string | null
  /** e.g. `spec-test-coverage/S1`, or null when there is no marker. */
  id: string | null
  /** Header text with the id marker stripped. */
  title: string
  /** Normalised body text, used to diff MODIFIED items against the main spec. */
  body: string
  /** Reason of a valid `[waived: reason]`, else null. */
  waiver: string | null
  /** True when a `[waived:]` marker is present but its reason is empty. */
  waiverInvalid: boolean
  op: DeltaOp
}

export interface ParsedSpec {
  capability: string
  items: SpecItem[]
}

const MARKER_RE = /\[(S\d+|INV\d+)\]/
const WAIVER_RE = /\[waived:([^\]]*)\]/i

function normalise(text: string): string {
  return text.replace(WAIVER_RE, ' ').replace(/\s+/g, ' ').trim()
}

function opFromHeading(heading: string): DeltaOp | null {
  const m = heading.match(/^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements\b/i)
  if (m)
    return m[1].toUpperCase() as DeltaOp
  if (/^##\s+Requirements\b/i.test(heading))
    return 'PRESENT'
  return null
}

/**
 * Parse a delta or main spec file into a flat list of scenario / invariant items.
 * `capability` is the spec directory path relative to `specs/`.
 */
export function parseSpec(content: string, capability: string): ParsedSpec {
  const lines = content.split(/\r?\n/)
  const items: SpecItem[] = []

  let op: DeltaOp = 'PRESENT'
  let requirement = ''
  let current: SpecItem | null = null
  const bodyLines: string[] = []

  const flush = () => {
    if (!current)
      return
    current.body = normalise(bodyLines.join('\n'))
    items.push(current)
    current = null
    bodyLines.length = 0
  }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flush()
      const next = opFromHeading(line)
      // A non-requirement heading (e.g. `## Purpose`) leaves the last op intact;
      // items only ever appear under requirement headers anyway.
      if (next)
        op = next
      continue
    }

    const req = line.match(/^###\s+Requirement:(.+)$/)
    if (req) {
      flush()
      requirement = req[1].trim()
      continue
    }

    const head = line.match(/^####\s+(Scenario|Invariant):(.+)$/)
    if (head) {
      flush()
      const kind: ItemKind = head[1].toLowerCase() === 'invariant' ? 'invariant' : 'scenario'
      const rawTitle = head[2].trim()
      const markerMatch = rawTitle.match(MARKER_RE)
      const marker = markerMatch ? markerMatch[1] : null
      // A waiver is an annotation on the scenario header only, never body prose
      // (a scenario may legitimately mention `[waived: ...]` while describing behaviour).
      const waiverMatch = rawTitle.match(WAIVER_RE)
      let waiver: string | null = null
      let waiverInvalid = false
      if (waiverMatch) {
        const reason = waiverMatch[1].trim()
        waiver = reason.length > 0 ? reason : null
        waiverInvalid = reason.length === 0
      }
      current = {
        kind,
        capability,
        requirement,
        marker,
        id: marker ? `${capability}/${marker}` : null,
        title: rawTitle.replace(MARKER_RE, '').replace(WAIVER_RE, '').trim(),
        body: '',
        waiver,
        waiverInvalid,
        op,
      }
      continue
    }

    if (current)
      bodyLines.push(line)
  }

  flush()
  return { capability, items }
}
