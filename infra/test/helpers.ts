import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { AppStack } from '../src/app-stack.ts'
import { CertStack } from '../src/cert-stack.ts'
import { CLOUDFRONT_CERT_REGION, ENVIRONMENTS, REGION } from '../src/config.ts'
import { CoreStack } from '../src/core-stack.ts'

export interface Templates {
  core: Template
  staging: Template
  prod: Template
}

/** Synthesize the stacks and return the templates under assertion. */
export function templates(): Templates {
  const app = new cdk.App()
  const account = '111111111111'
  const regional = { account, region: REGION }
  const certRegion = { account, region: CLOUDFRONT_CERT_REGION }

  const core = new CoreStack(app, 'Core', { env: regional, crossRegionReferences: true })

  // Construct every stack before taking any template snapshot: Template.fromStack
  // synthesizes the whole app, and the tree must not change afterwards.
  const stagingCert = new CertStack(app, 'StagingCert', {
    env: certRegion,
    crossRegionReferences: true,
    hostnames: ENVIRONMENTS.staging.hostnames,
    zone: core.zone,
  })
  const staging = new AppStack(app, 'Staging', {
    env: regional,
    crossRegionReferences: true,
    config: ENVIRONMENTS.staging,
    zone: core.zone,
    repo: core.repo,
    cloudFrontCert: stagingCert.certificate,
  })
  const prodCert = new CertStack(app, 'ProdCert', {
    env: certRegion,
    crossRegionReferences: true,
    hostnames: ENVIRONMENTS.prod.hostnames,
    zone: core.zone,
  })
  const prod = new AppStack(app, 'Prod', {
    env: regional,
    crossRegionReferences: true,
    config: ENVIRONMENTS.prod,
    zone: core.zone,
    repo: core.repo,
    cloudFrontCert: prodCert.certificate,
  })

  return {
    core: Template.fromStack(core),
    staging: Template.fromStack(staging),
    prod: Template.fromStack(prod),
  }
}
