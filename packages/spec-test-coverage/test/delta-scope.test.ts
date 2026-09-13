// @covers spec-test-coverage/S4
// @covers spec-test-coverage/S5
import { describe, expect, it } from 'vitest'
import { checkChange } from '../src/core.ts'
import { parseSpec } from '../src/parser.ts'

const main = parseSpec(`## Requirements
### Requirement: R
#### Scenario: [S1] unchanged
- **WHEN** a
- **THEN** b
#### Scenario: [S2] to change
- **WHEN** a
- **THEN** b
`, 'sample')

describe('delta scoping for MODIFIED requirements', () => {
  const deltaSpecs = [parseSpec(`## MODIFIED Requirements
### Requirement: R
#### Scenario: [S1] unchanged
- **WHEN** a
- **THEN** b
#### Scenario: [S2] to change
- **WHEN** a
- **THEN** something different now
`, 'sample')]

  const r = checkChange({ deltaSpecs, mainSpecs: [main], tags: [] })

  it('[S4] an unchanged scenario in a MODIFIED requirement is not gated', () => {
    expect(r.violations.some(v => v.id === 'sample/S1')).toBe(false)
  })

  it('[S5] a changed scenario in a MODIFIED requirement is gated', () => {
    expect(r.violations.some(v => v.kind === 'uncovered' && v.id === 'sample/S2')).toBe(true)
  })
})
