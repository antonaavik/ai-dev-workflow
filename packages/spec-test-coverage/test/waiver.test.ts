// @covers spec-test-coverage/S10
// @covers spec-test-coverage/S11
import { describe, expect, it } from 'vitest'
import { checkChange } from '../src/core.ts'
import { parseSpec } from '../src/parser.ts'

describe('waivers', () => {
  it('[S10] a waived scenario passes the gate', () => {
    const deltaSpecs = [parseSpec(`## ADDED Requirements
### Requirement: R
#### Scenario: [S1] copy only [waived: rendered copy, no logic to test]
- **WHEN** a
- **THEN** b
`, 'sample')]
    const r = checkChange({ deltaSpecs, mainSpecs: [], tags: [] })
    expect(r.ok).toBe(true)
    expect(r.satisfied).toContain('sample/S1')
  })

  it('[S11] a waiver with an empty reason is rejected', () => {
    const deltaSpecs = [parseSpec(`## ADDED Requirements
### Requirement: R
#### Scenario: [S1] copy only [waived: ]
- **WHEN** a
- **THEN** b
`, 'sample')]
    const r = checkChange({ deltaSpecs, mainSpecs: [], tags: [] })
    expect(r.violations.some(v => v.kind === 'invalid-waiver' && v.id === 'sample/S1')).toBe(true)
  })
})
