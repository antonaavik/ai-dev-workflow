import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface Tag {
  kind: 'covers' | 'invariant'
  id: string
  file: string
}

export interface ScanOptions {
  /** File names matching this are scanned. Default: `*.{test,spec}.{ts,tsx,js,mjs}`. */
  include?: RegExp
  /** Directory names skipped entirely. */
  excludeDirs?: string[]
}

const DEFAULT_INCLUDE = /\.(?:test|spec)\.(?:ts|tsx|js|mjs)$/
const DEFAULT_EXCLUDE = ['node_modules', 'dist', '.git', 'build', 'coverage']
const TAG_RE = /@(covers|invariant)\s+([\w\-./]+)/g

async function walk(dir: string, excludeDirs: string[]): Promise<string[]> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  }
  catch {
    return []
  }
  const files: string[] = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (excludeDirs.includes(entry.name))
        continue
      files.push(...await walk(full, excludeDirs))
    }
    else if (entry.isFile()) {
      files.push(full)
    }
  }
  return files
}

/** Scan test files under `root` for `@covers` / `@invariant` tags. */
export async function scanTags(root: string, options: ScanOptions = {}): Promise<Tag[]> {
  const include = options.include ?? DEFAULT_INCLUDE
  const excludeDirs = options.excludeDirs ?? DEFAULT_EXCLUDE
  const files = (await walk(root, excludeDirs)).filter(f => include.test(f))

  const tags: Tag[] = []
  for (const file of files) {
    const content = await readFile(file, 'utf8')
    for (const match of content.matchAll(TAG_RE)) {
      tags.push({
        kind: match[1] as 'covers' | 'invariant',
        id: match[2],
        file,
      })
    }
  }
  return tags
}
