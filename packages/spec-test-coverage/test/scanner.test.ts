import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { scanTags } from '../src/scanner.ts'

const here = dirname(fileURLToPath(import.meta.url))
const tagsDir = join(here, 'fixtures', 'tags')

describe('scanner', () => {
  it('finds coverage and invariant tags in matching files', async () => {
    const tags = await scanTags(tagsDir, { include: /\.txt$/ })
    expect(tags.some(t => t.kind === 'covers' && t.id === 'sample/S1')).toBe(true)
    expect(tags.some(t => t.kind === 'invariant' && t.id === 'sample/INV1')).toBe(true)
  })

  it('ignores files that do not match the include pattern', async () => {
    const tags = await scanTags(tagsDir, { include: /\.nomatch$/ })
    expect(tags).toHaveLength(0)
  })
})
