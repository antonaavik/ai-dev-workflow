import type * as route53 from 'aws-cdk-lib/aws-route53'
import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'

export interface CertStackProps extends cdk.StackProps {
  hostnames: string[]
  zone: route53.IHostedZone
}

/**
 * The CloudFront viewer certificate. CloudFront requires this cert in
 * us-east-1, so it lives in its own stack there and is referenced
 * cross-region by the eu-north-1 AppStack (ADR-0007).
 */
export class CertStack extends cdk.Stack {
  readonly certificate: acm.ICertificate

  constructor(scope: Construct, id: string, props: CertStackProps) {
    super(scope, id, props)
    this.certificate = new acm.Certificate(this, 'CloudFrontCert', {
      domainName: props.hostnames[0],
      subjectAlternativeNames: props.hostnames.slice(1),
      validation: acm.CertificateValidation.fromDns(props.zone),
    })
  }
}
