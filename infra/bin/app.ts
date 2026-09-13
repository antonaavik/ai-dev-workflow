import * as cdk from 'aws-cdk-lib'
import { AppStack } from '../src/app-stack.ts'
import { CertStack } from '../src/cert-stack.ts'
import { ACCOUNT, CLOUDFRONT_CERT_REGION, ENVIRONMENTS, REGION } from '../src/config.ts'
import { CoreStack } from '../src/core-stack.ts'

const app = new cdk.App()
const regional = { account: ACCOUNT, region: REGION }
const certRegion = { account: ACCOUNT, region: CLOUDFRONT_CERT_REGION }

// crossRegionReferences lets the eu-north-1 stacks consume the us-east-1 cert
// and the shared hosted zone across regions.
const core = new CoreStack(app, 'Core', { env: regional, crossRegionReferences: true })

for (const config of [ENVIRONMENTS.staging, ENVIRONMENTS.prod]) {
  const cert = new CertStack(app, `${config.name}Cert`, {
    env: certRegion,
    crossRegionReferences: true,
    hostnames: config.hostnames,
    zone: core.zone,
  })
  new AppStack(app, config.name, {
    env: regional,
    crossRegionReferences: true,
    config,
    zone: core.zone,
    repo: core.repo,
    cloudFrontCert: cert.certificate,
  })
}
