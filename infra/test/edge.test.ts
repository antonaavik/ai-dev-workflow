// @covers deployment/S1
// @covers deployment/S2
// @covers deployment/S3
// @covers deployment/S4
import { Match } from 'aws-cdk-lib/assertions'
import { beforeAll, describe, expect, it } from 'vitest'
import { templates } from './helpers.ts'

let staging: ReturnType<typeof templates>['staging']

beforeAll(() => {
  staging = templates().staging
})

describe('edge (CloudFront) topology', () => {
  it('[S1] serves the SPA from an S3 (OAC) origin with a root object', () => {
    staging.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: 'index.html',
        Origins: Match.arrayWith([
          Match.objectLike({ OriginAccessControlId: Match.anyValue() }),
        ]),
      }),
    })
  })

  it('[S2] routes /api/* to the ALB origin over HTTPS (same-origin, no CORS)', () => {
    staging.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        CacheBehaviors: Match.arrayWith([
          Match.objectLike({ PathPattern: 'api/*' }),
        ]),
        Origins: Match.arrayWith([
          Match.objectLike({
            CustomOriginConfig: Match.objectLike({ OriginProtocolPolicy: 'https-only' }),
          }),
        ]),
      }),
    })
  })

  it('[S3] falls back to the app shell for unknown paths', () => {
    staging.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        CustomErrorResponses: Match.arrayWith([
          Match.objectLike({ ErrorCode: 403, ResponseCode: 200, ResponsePagePath: '/index.html' }),
          Match.objectLike({ ErrorCode: 404, ResponseCode: 200, ResponsePagePath: '/index.html' }),
        ]),
      }),
    })
  })

  it('[S4] redirects plaintext HTTP to HTTPS', () => {
    staging.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultCacheBehavior: Match.objectLike({ ViewerProtocolPolicy: 'redirect-to-https' }),
      }),
    })
  })

  it('has the expected public hostname', () => {
    staging.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({ Aliases: ['staging.good-io.com'] }),
    })
    expect(true).toBe(true)
  })
})
