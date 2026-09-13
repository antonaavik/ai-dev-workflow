// @covers deployment/S6
// @covers deployment/S10
import { Match } from 'aws-cdk-lib/assertions'
import { beforeAll, describe, it } from 'vitest'
import { templates } from './helpers.ts'

let staging: ReturnType<typeof templates>['staging']

beforeAll(() => {
  staging = templates().staging
})

describe('server service', () => {
  it('[S6] health-checks the target group on GET /api/health', () => {
    staging.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      HealthCheckPath: '/api/health',
    })
  })

  it('[S10] enables the ECS deployment circuit breaker with rollback', () => {
    staging.hasResourceProperties('AWS::ECS::Service', {
      DeploymentConfiguration: Match.objectLike({
        DeploymentCircuitBreaker: { Enable: true, Rollback: true },
      }),
    })
  })
})
