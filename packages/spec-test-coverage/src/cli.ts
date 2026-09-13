#!/usr/bin/env node
import { join } from 'node:path'
import process from 'node:process'
import { buildMap, checkChange } from './core.ts'
import { loadSpecDir } from './io.ts'
import { scanTags } from './scanner.ts'

interface Flags { [k: string]: string | boolean }

function parseFlags(argv: string[]): Flags {
  const flags: Flags = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        flags[key] = next
        i++
      }
      else {
        flags[key] = true
      }
    }
  }
  return flags
}

function usage(): void {
  process.stdout.write(`openspec-coverage — spec↔test coverage gate

Usage:
  openspec-coverage check --change <name> [--repo <path>] [--tests <path>]
  openspec-coverage map [--repo <path>] [--tests <path>]
`)
}

async function runCheck(flags: Flags): Promise<number> {
  const change = typeof flags.change === 'string' ? flags.change : ''
  if (!change) {
    process.stderr.write('error: --change <name> is required\n')
    return 2
  }
  const repo = typeof flags.repo === 'string' ? flags.repo : process.cwd()
  const testsRoot = typeof flags.tests === 'string' ? flags.tests : repo

  const deltaSpecs = await loadSpecDir(join(repo, 'openspec', 'changes', change, 'specs'))
  const mainSpecs = await loadSpecDir(join(repo, 'openspec', 'specs'))
  const tags = await scanTags(testsRoot)

  const result = checkChange({ deltaSpecs, mainSpecs, tags })
  if (result.ok) {
    process.stdout.write(`✓ coverage gate passed for "${change}" (${result.satisfied.length} touched items satisfied)\n`)
    return 0
  }
  process.stdout.write(`✗ coverage gate failed for "${change}" — ${result.violations.length} violation(s):\n`)
  for (const v of result.violations)
    process.stdout.write(`  [${v.kind}] ${v.detail}\n`)
  return 1
}

async function runMap(flags: Flags): Promise<number> {
  const repo = typeof flags.repo === 'string' ? flags.repo : process.cwd()
  const testsRoot = typeof flags.tests === 'string' ? flags.tests : repo
  const mainSpecs = await loadSpecDir(join(repo, 'openspec', 'specs'))
  const tags = await scanTags(testsRoot)
  const map = buildMap(mainSpecs, tags)
  for (const e of map.entries) {
    const marker = e.covered ? '✓' : '·'
    process.stdout.write(`${marker} ${e.id}  ${e.covered ? e.coveredBy.join(', ') : '(uncovered)'}\n`)
  }
  process.stdout.write(`\n${map.entries.length} item(s), ${map.uncovered.length} uncovered\n`)
  return 0
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2)
  const flags = parseFlags(rest)
  let code: number
  switch (command) {
    case 'check':
      code = await runCheck(flags)
      break
    case 'map':
      code = await runMap(flags)
      break
    default:
      usage()
      code = command ? 2 : 0
  }
  process.exitCode = code
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`)
  process.exitCode = 1
})
