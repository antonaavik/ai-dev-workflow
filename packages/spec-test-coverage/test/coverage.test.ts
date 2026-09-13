// Dogfood coverage of the checker's own scenarios:
// @covers spec-test-coverage/S1
// @covers spec-test-coverage/S2
// @covers spec-test-coverage/S3
// @covers spec-test-coverage/S6
// @covers spec-test-coverage/S16
import type { Tag } from '../src/scanner.ts'
import { describe, expect, it } from 'vitest'
import { checkChange } from '../src/core.ts'
import { parseSpec } from '../src/parser.ts'

function delta(md: string) {
  return [parseSpec(md, 'sample')]
}

describe('coverage gate over ADDED items', () => {
  it('[S1] a touched scenario with a covering test passes', () => {
    const deltaSpecs = delta(`## ADDED Requirements
### Requirement: R
#### Scenario: [S1] x
- **WHEN** a
- **THEN** b
`)
    const tags: Tag[] = [{ kind: 'covers', id: 'sample/S1', file: 'x.test.ts' }]
    const r = checkChange({ deltaSpecs, mainSpecs: [], tags })
    expect(r.ok).toBe(true)
    expect(r.satisfied).toContain('sample/S1')
  })

  it('[S2] a touched scenario with no covering test fails', () => {
    const deltaSpecs = delta(`## ADDED Requirements
### Requirement: R
#### Scenario: [S1] x
- **WHEN** a
- **THEN** b
`)
    const r = checkChange({ deltaSpecs, mainSpecs: [], tags: [] })
    expect(r.ok).toBe(false)
    expect(r.violations.some(v => v.kind === 'uncovered' && v.id === 'sample/S1')).toBe(true)
  })

  it('[S3] a touched invariant with no covering test fails', () => {
    const deltaSpecs = delta(`## ADDED Requirements
### Requirement: R
#### Invariant: [INV1] holds
- **WHEN** a
- **THEN** b
`)
    const r = checkChange({ deltaSpecs, mainSpecs: [], tags: [] })
    expect(r.violations.some(v => v.kind === 'uncovered' && v.id === 'sample/INV1')).toBe(true)
  })

  it('[S6] every scenario of an ADDED requirement is gated', () => {
    const deltaSpecs = delta(`## ADDED Requirements
### Requirement: R
#### Scenario: [S1] a
- **WHEN** a
- **THEN** b
#### Scenario: [S2] b
- **WHEN** a
- **THEN** b
#### Scenario: [S3] c
- **WHEN** a
- **THEN** b
`)
    const tags: Tag[] = [{ kind: 'covers', id: 'sample/S1', file: 'x' }]
    const r = checkChange({ deltaSpecs, mainSpecs: [], tags })
    const uncovered = r.violations.filter(v => v.kind === 'uncovered').map(v => v.id)
    expect(uncovered).toEqual(['sample/S2', 'sample/S3'])
  })

  it('[S16] a touched item without an id is a violation', () => {
    const deltaSpecs = delta(`## ADDED Requirements
### Requirement: R
#### Scenario: no id here
- **WHEN** a
- **THEN** b
`)
    const r = checkChange({ deltaSpecs, mainSpecs: [], tags: [] })
    expect(r.violations.some(v => v.kind === 'missing-id')).toBe(true)
  })
})
