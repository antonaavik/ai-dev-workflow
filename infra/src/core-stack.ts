import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { GITHUB_REPO, ZONE_NAME } from './config.ts'

/**
 * Account-level, shared resources: the DNS zone, the single image registry
 * (so staging→prod promotes one digest, ADR-0009 INV1), and the GitHub OIDC
 * provider + least-privilege deploy roles (ADR-0007).
 */
export class CoreStack extends cdk.Stack {
  readonly zone: route53.IHostedZone
  readonly repo: ecr.IRepository

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.zone = new route53.PublicHostedZone(this, 'Zone', { zoneName: ZONE_NAME })

    this.repo = new ecr.Repository(this, 'ServerRepo', {
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      lifecycleRules: [{ maxImageCount: 30 }],
    })

    const provider = new iam.OpenIdConnectProvider(this, 'GithubOidc', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    })

    // App-rollout role: push images and roll the ECS service + web assets.
    // Infra changes go through the CDK bootstrap roles this role may assume.
    const rolloutPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['ecr:GetAuthorizationToken'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          actions: [
            'ecr:BatchCheckLayerAvailability',
            'ecr:PutImage',
            'ecr:InitiateLayerUpload',
            'ecr:UploadLayerPart',
            'ecr:CompleteLayerUpload',
            'ecr:BatchGetImage',
            'ecr:GetDownloadUrlForLayer',
          ],
          resources: [this.repo.repositoryArn],
        }),
        new iam.PolicyStatement({
          actions: [
            'ecs:RegisterTaskDefinition',
            'ecs:DeregisterTaskDefinition',
            'ecs:UpdateService',
            'ecs:DescribeServices',
            'ecs:DescribeTaskDefinition',
            'cloudfront:CreateInvalidation',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          actions: ['s3:PutObject', 's3:DeleteObject', 's3:ListBucket', 's3:GetObject'],
          resources: [`arn:aws:s3:::good-io-*`, `arn:aws:s3:::good-io-*/*`],
        }),
        new iam.PolicyStatement({
          // Assume the CDK bootstrap roles for `cdk deploy` of infra changes.
          actions: ['sts:AssumeRole'],
          resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
        }),
        new iam.PolicyStatement({
          actions: ['iam:PassRole'],
          resources: ['*'],
          conditions: { StringEquals: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' } },
        }),
      ],
    })

    const makeRole = (id2: string, subClaim: string) =>
      new iam.Role(this, id2, {
        assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
          StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
          StringLike: { 'token.actions.githubusercontent.com:sub': subClaim },
        }),
        inlinePolicies: { rollout: rolloutPolicy },
        maxSessionDuration: cdk.Duration.hours(1),
      })

    // Staging: any branch/PR in the repo. Prod: only the main ref.
    makeRole('GithubDeployStaging', `repo:${GITHUB_REPO}:*`)
    makeRole('GithubDeployProd', `repo:${GITHUB_REPO}:ref:refs/heads/main`)
  }
}
