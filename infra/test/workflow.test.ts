// @covers deployment/S7
// @covers deployment/S8
// @covers deployment/S9
// @invariant deployment/INV1
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

let wf: any

beforeAll(() => {
  wf = parse(readFileSync(join(repoRoot, '.github/workflows/deploy.yml'), 'utf8'))
})

function stepsText(jobId: string): string {
  return JSON.stringify(wf.jobs[jobId]?.steps ?? [])
}

describe('deploy pipeline wiring', () => {
  it('[S7] a merge to main deploys to staging and smoke-tests it', () => {
    const on = wf.on ?? wf.true // guard: some YAML flavours coerce `on`
    expect(on.push.branches).toContain('main')
    expect(wf.jobs).toHaveProperty('deploy-staging')
    expect(wf.jobs).toHaveProperty('smoke-staging')
    expect(wf.jobs['smoke-staging'].needs).toContain('deploy-staging')
  })

  it('[S8] a green staging smoke auto-promotes to prod with no manual approval', () => {
    expect(wf.jobs['deploy-prod'].needs).toContain('smoke-staging')
    // No GitHub Environment approval gate on the prod job.
    expect(wf.jobs['deploy-prod'].environment).toBeUndefined()
  })

  it('[S9] a red staging smoke blocks prod (prod depends on the smoke job)', () => {
    expect(wf.jobs['deploy-prod'].needs).toContain('smoke-staging')
  })

  it('[INV1] prod runs the same built artifact, promoted not rebuilt', () => {
    // Both environments deploy the same build output...
    expect(stepsText('deploy-staging')).toContain('needs.build.outputs.image')
    expect(stepsText('deploy-prod')).toContain('needs.build.outputs.image')
    // ...and only the build job builds an image.
    expect(stepsText('build')).toContain('docker buildx build')
    expect(stepsText('deploy-prod')).not.toContain('docker buildx build')
    expect(stepsText('deploy-staging')).not.toContain('docker buildx build')
  })
})
