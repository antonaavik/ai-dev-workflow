import type * as ecr from 'aws-cdk-lib/aws-ecr'
import type { Construct } from 'constructs'
import type { EnvConfig } from './config.ts'
import * as cdk from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { CLOUDFRONT_PREFIX_LIST, CONTAINER_PORT, ZONE_NAME } from './config.ts'

export interface AppStackProps extends cdk.StackProps {
  config: EnvConfig
  zone: route53.IHostedZone
  repo: ecr.IRepository
}

/** One environment (staging or prod): edge, server, networking, DNS/TLS. */
export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props)
    const { config, zone, repo } = props

    // Deploy-time inputs (defaults keep `cdk synth` runnable offline).
    const imageTag = String(this.node.tryGetContext('imageTag') ?? 'latest')
    const originSecret = String(this.node.tryGetContext('originSecret') ?? 'REPLACE_AT_DEPLOY')

    // --- Networking: public subnets, no NAT (ADR-0008) ---
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [{ name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 }],
    })

    const albSg = new ec2.SecurityGroup(this, 'AlbSg', { vpc, description: 'ALB: CloudFront origin-facing only' })
    albSg.addIngressRule(ec2.Peer.prefixList(CLOUDFRONT_PREFIX_LIST), ec2.Port.tcp(443), 'CloudFront only')

    const taskSg = new ec2.SecurityGroup(this, 'TaskSg', { vpc, description: 'Tasks: from ALB only' })
    taskSg.addIngressRule(albSg, ec2.Port.tcp(CONTAINER_PORT), 'From ALB only')

    // --- Server (ECS Fargate, arm64) ---
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc })
    const taskDef = new ecs.FargateTaskDefinition(this, 'Task', {
      cpu: config.cpu,
      memoryLimitMiB: config.memoryLimitMiB,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    })
    taskDef.addContainer('server', {
      image: ecs.ContainerImage.fromEcrRepository(repo, imageTag),
      portMappings: [{ containerPort: CONTAINER_PORT }],
      environment: { NODE_ENV: 'production', SERVER_PORT: String(CONTAINER_PORT) },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'server' }),
    })
    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: config.desiredCount,
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [taskSg],
      // ADR-0009: auto-rollback on a failed rollout.
      circuitBreaker: { rollback: true },
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    })

    // --- ALB (health-gated, locked to CloudFront) ---
    const albCert = new acm.Certificate(this, 'AlbCert', {
      domainName: config.originHostname,
      validation: acm.CertificateValidation.fromDns(zone),
    })
    const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', { vpc, internetFacing: true, securityGroup: albSg })
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'Tg', {
      vpc,
      port: CONTAINER_PORT,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: { path: '/api/health', healthyHttpCodes: '200' },
    })
    service.attachToApplicationTargetGroup(targetGroup)

    const listener = alb.addListener('Https', {
      port: 443,
      certificates: [albCert],
      // Do not auto-open 443 to the world; the ALB SG already admits only the
      // CloudFront prefix list, and the secret-header rule is the second layer.
      open: false,
      // Anything without the CloudFront-injected secret header is refused.
      defaultAction: elbv2.ListenerAction.fixedResponse(403, {
        contentType: 'text/plain',
        messageBody: 'Direct access denied',
      }),
    })
    listener.addAction('Api', {
      priority: 1,
      conditions: [elbv2.ListenerCondition.httpHeader('X-Origin-Verify', [originSecret])],
      action: elbv2.ListenerAction.forward([targetGroup]),
    })

    // --- Web bucket (private, OAC) ---
    const bucket = new s3.Bucket(this, 'WebBucket', {
      bucketName: `good-io-${config.name.toLowerCase()}-web`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    })

    // --- Route 53: originHostname → ALB ---
    new route53.ARecord(this, 'OriginRecord', {
      zone,
      recordName: this.relativeName(config.originHostname),
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(alb)),
    })

    // --- CloudFront: S3 default behaviour + /api/* → ALB origin ---
    const cfCert = new acm.Certificate(this, 'CfCert', {
      domainName: config.hostnames[0],
      subjectAlternativeNames: config.hostnames.slice(1),
      validation: acm.CertificateValidation.fromDns(zone),
    })
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      domainNames: config.hostnames,
      certificate: cfCert,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        'api/*': {
          origin: new origins.HttpOrigin(config.originHostname, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            customHeaders: { 'X-Origin-Verify': originSecret },
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      // SPA fallback: unknown paths resolve to the app shell.
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    })

    // --- Route 53: public hostnames → CloudFront ---
    config.hostnames.forEach((hostname, i) => {
      new route53.ARecord(this, `CfRecord${i}`, {
        zone,
        recordName: this.relativeName(hostname),
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      })
    })

    new cdk.CfnOutput(this, 'Url', { value: `https://${config.hostnames[0]}` })
    new cdk.CfnOutput(this, 'WebBucketName', { value: bucket.bucketName })
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId })
    new cdk.CfnOutput(this, 'ServiceName', { value: service.serviceName })
  }

  /** A record name relative to the hosted zone (apex → undefined). */
  private relativeName(fqdn: string): string | undefined {
    if (fqdn === ZONE_NAME)
      return undefined
    return fqdn.slice(0, fqdn.length - ZONE_NAME.length - 1)
  }
}
