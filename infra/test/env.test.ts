// @covers deployment/S12
import { Match } from 'aws-cdk-lib/assertions'
import { beforeAll, describe, it } from 'vitest'
import { templates } from './helpers.ts'

let t: ReturnType<typeof templates>

beforeAll(() => {
  t = templates()
})

describe('environment isolation', () => {
  it('[S12] staging and prod are separate stacks with distinct hostnames', () => {
    t.staging.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({ Aliases: Match.arrayWith(['staging.good-io.com']) }),
    })
    t.prod.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({ Aliases: Match.arrayWith(['good-io.com']) }),
    })
    // Each environment owns its own service, so staging changes cannot touch prod.
    t.staging.resourceCountIs('AWS::ECS::Service', 1)
    t.prod.resourceCountIs('AWS::ECS::Service', 1)
  })
})
