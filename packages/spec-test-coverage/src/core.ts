import type { ParsedSpec, SpecItem } from './parser.ts'
import type { Tag } from './scanner.ts'

export type ViolationKind = 'uncovered' | 'dangling' | 'invalid-waiver' | 'missing-id'

export interface Violation {
  kind: ViolationKind
  id: string | null
  detail: string
}

export interface CheckInput {
  /** Parsed delta spec files from the change. */
  deltaSpecs: ParsedSpec[]
  /** Parsed main spec files from `openspec/specs`. */
  mainSpecs: ParsedSpec[]
  tags: Tag[]
}

export interface CheckResult {
  ok: boolean
  violations: Violation[]
  /** Ids of touched items that are satisfied (covered or validly waived). */
  satisfied: string[]
}

function titleKey(item: SpecItem): string {
  return `${item.capability}::${item.requirement}::${item.title}`
}

function coveredBy(item: SpecItem, tags: Tag[]): boolean {
  if (!item.id)
    return false
  const wanted = item.kind === 'invariant' ? 'invariant' : 'covers'
  return tags.some(t => t.kind === wanted && t.id === item.id)
}

/** Run the delta-scoped coverage gate. */
export function checkChange(input: CheckInput): CheckResult {
  const { deltaSpecs, mainSpecs, tags } = input
  const violations: Violation[] = []
  const satisfied: string[] = []

  // Index main-spec items for MODIFIED comparison, by id and by title.
  const mainById = new Map<string, SpecItem>()
  const mainByKey = new Map<string, SpecItem>()
  for (const spec of mainSpecs) {
    for (const item of spec.items) {
      if (item.id)
        mainById.set(item.id, item)
      mainByKey.set(titleKey(item), item)
    }
  }

  // Valid id universe for dangling detection: main + delta ADDED/MODIFIED, minus REMOVED.
  const validIds = new Set<string>()
  for (const item of mainById.keys())
    validIds.add(item)
  for (const spec of deltaSpecs) {
    for (const item of spec.items) {
      if (!item.id)
        continue
      if (item.op === 'ADDED' || item.op === 'MODIFIED')
        validIds.add(item.id)
      else if (item.op === 'REMOVED')
        validIds.delete(item.id)
    }
  }

  // Coverage gate over touched items.
  for (const spec of deltaSpecs) {
    for (const item of spec.items) {
      if (!isTouched(item, mainById, mainByKey))
        continue

      if (!item.id) {
        violations.push({
          kind: 'missing-id',
          id: null,
          detail: `${item.kind} "${item.title}" (in ${item.requirement}) has no [S<n>]/[INV<n>] id`,
        })
        continue
      }
      if (item.waiverInvalid) {
        violations.push({ kind: 'invalid-waiver', id: item.id, detail: `${item.id} has a waiver with an empty reason` })
        continue
      }
      if (item.waiver !== null) {
        satisfied.push(item.id)
        continue
      }
      if (coveredBy(item, tags)) {
        satisfied.push(item.id)
        continue
      }
      violations.push({ kind: 'uncovered', id: item.id, detail: `${item.id} has no covering test and no waiver` })
    }
  }

  // Dangling links: any tag pointing at an id that does not exist.
  const seen = new Set<string>()
  for (const tag of tags) {
    if (validIds.has(tag.id) || seen.has(tag.id))
      continue
    seen.add(tag.id)
    violations.push({ kind: 'dangling', id: tag.id, detail: `${tag.id} is referenced by a test but exists in no spec` })
  }

  return { ok: violations.length === 0, violations, satisfied }
}

function isTouched(
  item: SpecItem,
  mainById: Map<string, SpecItem>,
  mainByKey: Map<string, SpecItem>,
): boolean {
  if (item.op === 'ADDED')
    return true
  if (item.op !== 'MODIFIED')
    return false
  // MODIFIED: gated only when the item's text differs from the current main spec.
  const prior = (item.id && mainById.get(item.id)) || mainByKey.get(titleKey(item))
  if (!prior)
    return true
  return prior.body !== item.body
}

export interface MapEntry {
  id: string
  kind: SpecItem['kind']
  title: string
  coveredBy: string[]
  covered: boolean
}

export interface CoverageMap {
  entries: MapEntry[]
  uncovered: string[]
}

/** Build the reporting-only global spec↔test map over the living specs. */
export function buildMap(mainSpecs: ParsedSpec[], tags: Tag[]): CoverageMap {
  const entries: MapEntry[] = []
  const uncovered: string[] = []
  for (const spec of mainSpecs) {
    for (const item of spec.items) {
      if (!item.id)
        continue
      const wanted = item.kind === 'invariant' ? 'invariant' : 'covers'
      const files = tags.filter(t => t.kind === wanted && t.id === item.id).map(t => t.file)
      const covered = files.length > 0
      entries.push({ id: item.id, kind: item.kind, title: item.title, coveredBy: files, covered })
      if (!covered)
        uncovered.push(item.id)
    }
  }
  return { entries, uncovered }
}
