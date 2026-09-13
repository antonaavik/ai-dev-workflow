import type { ParsedSpec } from './parser.ts'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { parseSpec } from './parser.ts'

const EXCLUDE = new Set(['node_modules', 'dist', '.git', 'archive'])

async function findSpecFiles(root: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  }
  catch {
    return []
  }
  const files: string[] = []
  for (const entry of entries) {
    const full = join(root, entry.name)
    if (entry.isDirectory()) {
      if (EXCLUDE.has(entry.name))
        continue
      files.push(...await findSpecFiles(full))
    }
    else if (entry.isFile() && entry.name === 'spec.md') {
      files.push(full)
    }
  }
  return files
}

/**
 * Load and parse every `spec.md` under `root`, deriving each capability path
 * from the directory holding the file (relative to `root`).
 */
export async function loadSpecDir(root: string): Promise<ParsedSpec[]> {
  const files = await findSpecFiles(root)
  const specs: ParsedSpec[] = []
  for (const file of files) {
    const capability = relative(root, dirname(file)).split(sep).join('/')
    const content = await readFile(file, 'utf8')
    specs.push(parseSpec(content, capability))
  }
  return specs
}
