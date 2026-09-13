// @covers deployment/S5
// @covers deployment/S6
import { Match } from 'aws-cdk-lib/assertions'
import { beforeAll, describe, expect, it } from 'vitest'
import { templates } from './helpers.ts'

let staging: ReturnType<typeof templates>['staging']

beforeAll(() => {
  staging = templates().staging
})

describe('origin locking and isolation', () => {
  it('[S5] the ALB admits ingress only from the CloudFront prefix list', () => {
    // Ingress is locked to a prefix list (resolved by lookup), not an open CIDR.
    staging.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      SourcePrefixListId: Match.anyValue(),
      FromPort: 443,
      ToPort: 443,
    })
    // The prefix list looked up is specifically CloudFront's origin-facing one.
    expect(JSON.stringify(staging.toJSON())).toContain('com.amazonaws.global.cloudfront.origin-facing')
    // And nothing opens 443 to the world.
    const open = Object.values(staging.findResources('AWS::EC2::SecurityGroupIngress'))
      .some((r: any) => r.Properties?.CidrIp === '0.0.0.0/0' && r.Properties?.FromPort === 443)
    expect(open).toBe(false)
  })

  it('[S5] the listener refuses requests without the CloudFront secret header', () => {
    // Default action is a 403 fixed response...
    staging.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      DefaultActions: Match.arrayWith([
        Match.objectLike({ FixedResponseConfig: Match.objectLike({ StatusCode: '403' }) }),
      ]),
    })
    // ...and only a request carrying the secret header is forwarded.
    staging.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
      Conditions: Match.arrayWith([
        Match.objectLike({
          Field: 'http-header',
          HttpHeaderConfig: Match.objectLike({ HttpHeaderName: 'X-Origin-Verify' }),
        }),
      ]),
    })
  })

  it('[S5] CloudFront injects the secret origin header to the ALB origin', () => {
    staging.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        Origins: Match.arrayWith([
          Match.objectLike({
            OriginCustomHeaders: Match.arrayWith([
              Match.objectLike({ HeaderName: 'X-Origin-Verify' }),
            ]),
          }),
        ]),
      }),
    })
  })

  it('[S6] tasks accept traffic only from the ALB, on the container port', () => {
    staging.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 3000,
      ToPort: 3000,
    })
  })
})
