import { describe, expect, it } from 'vitest'
import { parseSpec } from '../src/parser.ts'

const md = `## ADDED Requirements

### Requirement: Example
Some requirement text.

#### Scenario: [S1] has an id
- **WHEN** x
- **THEN** y

#### Scenario: no marker here
- **WHEN** a
- **THEN** b

#### Scenario: [S2] validly waived [waived: rendered copy, no logic]
- **WHEN** a
- **THEN** b

#### Scenario: [S3] empty waiver [waived: ]
- **WHEN** a
- **THEN** b

#### Invariant: [INV1] holds always
- **WHEN** a
- **THEN** b
`

describe('parser', () => {
  const { items } = parseSpec(md, 'sample')

  it('extracts id markers and the delta operation', () => {
    expect(items[0].id).toBe('sample/S1')
    expect(items[0].kind).toBe('scenario')
    expect(items[0].op).toBe('ADDED')
  })

  it('leaves id null when the header has no marker', () => {
    expect(items[1].id).toBeNull()
    expect(items[1].marker).toBeNull()
  })

  it('parses a valid waiver and rejects an empty one', () => {
    expect(items[2].waiver).toBe('rendered copy, no logic')
    expect(items[2].waiverInvalid).toBe(false)
    expect(items[3].waiver).toBeNull()
    expect(items[3].waiverInvalid).toBe(true)
  })

  it('recognises invariants', () => {
    const inv = items.find(i => i.marker === 'INV1')
    expect(inv?.kind).toBe('invariant')
    expect(inv?.id).toBe('sample/INV1')
  })
})
