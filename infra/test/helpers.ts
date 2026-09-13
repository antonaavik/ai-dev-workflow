import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { AppStack } from '../src/app-stack.ts'
import { ENVIRONMENTS } from '../src/config.ts'
import { CoreStack } from '../src/core-stack.ts'

export interface Templates {
  core: Template
  staging: Template
  prod: Template
}

/** Synthesize the three stacks and return their CloudFormation templates. */
export function templates(): Templates {
  const app = new cdk.App()
  const env = { account: '111111111111', region: 'us-east-1' }
  const core = new CoreStack(app, 'Core', { env })
  const staging = new AppStack(app, 'Staging', { env, config: ENVIRONMENTS.staging, zone: core.zone, repo: core.repo })
  const prod = new AppStack(app, 'Prod', { env, config: ENVIRONMENTS.prod, zone: core.zone, repo: core.repo })
  return {
    core: Template.fromStack(core),
    staging: Template.fromStack(staging),
    prod: Template.fromStack(prod),
  }
}
