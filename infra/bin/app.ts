import * as cdk from 'aws-cdk-lib'
import { AppStack } from '../src/app-stack.ts'
import { ACCOUNT, ENVIRONMENTS, REGION } from '../src/config.ts'
import { CoreStack } from '../src/core-stack.ts'

const app = new cdk.App()
const env = { account: ACCOUNT, region: REGION }

const core = new CoreStack(app, 'Core', { env })

new AppStack(app, 'Staging', { env, config: ENVIRONMENTS.staging, zone: core.zone, repo: core.repo })
new AppStack(app, 'Prod', { env, config: ENVIRONMENTS.prod, zone: core.zone, repo: core.repo })
