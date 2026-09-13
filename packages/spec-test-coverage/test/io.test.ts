import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadSpecDir } from '../src/io.ts'

const here = dirname(fileURLToPath(import.meta.url))
const specsRoot = join(here, 'fixtures', 'main', 'specs')

describe('io', () => {
  it('loads spec.md files and derives the capability from the directory', async () => {
    const specs = await loadSpecDir(specsRoot)
    expect(specs).toHaveLength(1)
    expect(specs[0].capability).toBe('sample')
    expect(specs[0].items[0].id).toBe('sample/S1')
  })

  it('returns an empty list for a missing directory', async () => {
    const specs = await loadSpecDir(join(specsRoot, 'does-not-exist'))
    expect(specs).toEqual([])
  })
})
