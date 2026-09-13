// @covers spec-test-coverage/S7
// @covers spec-test-coverage/S8
import type { Tag } from '../src/scanner.ts'
import { describe, expect, it } from 'vitest'
import { checkChange } from '../src/core.ts'
import { parseSpec } from '../src/parser.ts'

const deltaSpecs = [parseSpec(`## ADDED Requirements
### Requirement: R
#### Scenario: [S1] x
- **WHEN** a
- **THEN** b
`, 'sample')]

describe('dangling-link detection', () => {
  it('[S7] a tag pointing at a non-existent id fails', () => {
    const tags: Tag[] = [
      { kind: 'covers', id: 'sample/S1', file: 'a.test.ts' },
      { kind: 'covers', id: 'sample/S99', file: 'b.test.ts' },
    ]
    const r = checkChange({ deltaSpecs, mainSpecs: [], tags })
    expect(r.violations.some(v => v.kind === 'dangling' && v.id === 'sample/S99')).toBe(true)
  })

  it('[S8] a valid tag is not reported as dangling', () => {
    const tags: Tag[] = [{ kind: 'covers', id: 'sample/S1', file: 'a.test.ts' }]
    const r = checkChange({ deltaSpecs, mainSpecs: [], tags })
    expect(r.violations.some(v => v.kind === 'dangling')).toBe(false)
    expect(r.ok).toBe(true)
  })
})
