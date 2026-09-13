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

/** Region is fixed to us-east-1 so the CloudFront ACM cert lives in-stack (ADR-0007). */
export const REGION = 'us-east-1'
export const ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT
export const ZONE_NAME = 'good-io.com'
export const GITHUB_REPO = 'antonaavik/ai-dev-workflow'

/**
 * AWS-managed prefix list for CloudFront origin-facing IP ranges in us-east-1
 * (com.amazonaws.global.cloudfront.origin-facing). Locks the ALB to CloudFront.
 */
export const CLOUDFRONT_PREFIX_LIST = 'pl-3b927c52'

/** Container port the Express server listens on. */
export const CONTAINER_PORT = 3000

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
