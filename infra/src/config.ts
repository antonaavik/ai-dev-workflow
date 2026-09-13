import process from 'node:process'

export interface EnvConfig {
  /** Stack id / logical environment name. */
  name: string
  /** Public hostnames fronted by CloudFront (first is the primary). */
  hostnames: string[]
  /** Hostname aliased to the ALB and used as the CloudFront /api origin. */
  originHostname: string
  desiredCount: number
  cpu: number
  memoryLimitMiB: number
}

/**
 * Regional resources live near our users (Estonia → Stockholm, ADR-0007).
 * CloudFront's viewer certificate must live in us-east-1 regardless, so it is
 * provisioned in a dedicated us-east-1 stack and referenced cross-region.
 */
export const REGION = 'eu-north-1'
export const CLOUDFRONT_CERT_REGION = 'us-east-1'
export const ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT
export const ZONE_NAME = 'good-io.com'
export const GITHUB_REPO = 'antonaavik/ai-dev-workflow'

/** Container port the Express server listens on. */
export const CONTAINER_PORT = 3000

/**
 * Name of the AWS-managed prefix list for CloudFront origin-facing IPs. Its id
 * differs per region, so it is resolved by lookup at deploy time rather than
 * hardcoded (see AppStack).
 */
export const CLOUDFRONT_PREFIX_LIST_NAME = 'com.amazonaws.global.cloudfront.origin-facing'

export const ENVIRONMENTS: Record<'staging' | 'prod', EnvConfig> = {
  staging: {
    name: 'Staging',
    hostnames: ['staging.good-io.com'],
    originHostname: 'origin.staging.good-io.com',
    desiredCount: 1,
    cpu: 256,
    memoryLimitMiB: 512,
  },
  prod: {
    name: 'Prod',
    hostnames: ['good-io.com', 'www.good-io.com'],
    originHostname: 'origin.good-io.com',
    desiredCount: 2,
    cpu: 512,
    memoryLimitMiB: 1024,
  },
}
