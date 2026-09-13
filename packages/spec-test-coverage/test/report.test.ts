// @covers spec-test-coverage/S12
// @covers spec-test-coverage/S13
import type { Tag } from '../src/scanner.ts'
import { describe, expect, it } from 'vitest'
import { checkChange } from '../src/core.ts'
import { parseSpec } from '../src/parser.ts'

describe('reporting and exit status', () => {
  it('[S12] a clean change is ok (maps to exit zero)', () => {
    const deltaSpecs = [parseSpec(`## ADDED Requirements
### Requirement: R
#### Scenario: [S1] x
- **WHEN** a
- **THEN** b
`, 'sample')]
    const tags: Tag[] = [{ kind: 'covers', id: 'sample/S1', file: 'a.test.ts' }]
    const r = checkChange({ deltaSpecs, mainSpecs: [], tags })
    expect(r.ok).toBe(true)
  })

  it('[S13] any violation is not ok and every offending id is itemised', () => {
    const deltaSpecs = [parseSpec(`## ADDED Requirements
### Requirement: R
#### Scenario: [S1] a
- **WHEN** a
- **THEN** b
#### Scenario: [S2] b
- **WHEN** a
- **THEN** b
`, 'sample')]
    // Two uncovered scenarios plus one dangling tag.
    const tags: Tag[] = [{ kind: 'covers', id: 'sample/S99', file: 'a.test.ts' }]
    const r = checkChange({ deltaSpecs, mainSpecs: [], tags })
    expect(r.ok).toBe(false)
    const ids = r.violations.map(v => v.id)
    expect(ids).toContain('sample/S1')
    expect(ids).toContain('sample/S2')
    expect(ids).toContain('sample/S99')
    expect(r.violations).toHaveLength(3)
  })
})
