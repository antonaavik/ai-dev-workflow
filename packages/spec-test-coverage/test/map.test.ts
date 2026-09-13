// @covers spec-test-coverage/S14
// @covers spec-test-coverage/S15
import type { Tag } from '../src/scanner.ts'
import { describe, expect, it } from 'vitest'
import { buildMap } from '../src/core.ts'
import { parseSpec } from '../src/parser.ts'

const mainSpecs = [parseSpec(`## Requirements
### Requirement: R
#### Scenario: [S1] covered
- **WHEN** a
- **THEN** b
#### Scenario: [S2] uncovered
- **WHEN** a
- **THEN** b
`, 'sample')]

describe('global spec↔test map', () => {
  it('[S14] associates each id with the tests that cover it', () => {
    const tags: Tag[] = [{ kind: 'covers', id: 'sample/S1', file: 'a.test.ts' }]
    const map = buildMap(mainSpecs, tags)
    const entry = map.entries.find(e => e.id === 'sample/S1')
    expect(entry?.covered).toBe(true)
    expect(entry?.coveredBy).toContain('a.test.ts')
  })

  it('[S15] lists uncovered ids without failing', () => {
    const map = buildMap(mainSpecs, [])
    expect(map.uncovered).toContain('sample/S1')
    expect(map.uncovered).toContain('sample/S2')
    // buildMap is pure and reporting-only; the CLI maps this to exit zero.
    expect(map.entries.every(e => typeof e.covered === 'boolean')).toBe(true)
  })
})
