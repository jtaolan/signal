import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class StorageStack extends cdk.Stack {
  public readonly audioBucket: s3.Bucket;
  public readonly archiveBucket: s3.Bucket;
  public readonly sourcesTable: dynamodb.Table;
  public readonly contentTable: dynamodb.Table;
  public readonly briefsTable: dynamodb.Table;
  public readonly subscriptionsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.audioBucket = new s3.Bucket(this, 'AudioBucket', {
      bucketName: `signals-audio-${this.account}`,
      lifecycleRules: [{ expiration: cdk.Duration.days(30) }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.archiveBucket = new s3.Bucket(this, 'ArchiveBucket', {
      bucketName: `signals-archive-${this.account}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.sourcesTable = new dynamodb.Table(this, 'SourcesTable', {
      tableName: 'signals-sources',
      partitionKey: { name: 'sourceId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.contentTable = new dynamodb.Table(this, 'ContentTable', {
      tableName: 'signals-content',
      partitionKey: { name: 'contentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.contentTable.addGlobalSecondaryIndex({
      indexName: 'sourceId-createdAt-index',
      partitionKey: { name: 'sourceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    this.briefsTable = new dynamodb.Table(this, 'BriefsTable', {
      tableName: 'signals-briefs',
      partitionKey: { name: 'briefId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.briefsTable.addGlobalSecondaryIndex({
      indexName: 'theme-createdAt-index',
      partitionKey: { name: 'theme', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    this.subscriptionsTable = new dynamodb.Table(this, 'SubscriptionsTable', {
      tableName: 'signals-subscriptions',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.subscriptionsTable.addGlobalSecondaryIndex({
      indexName: 'unsubscribeToken-index',
      partitionKey: { name: 'unsubscribeToken', type: dynamodb.AttributeType.STRING },
    });

    new cdk.CfnOutput(this, 'AudioBucketName', { value: this.audioBucket.bucketName });
    new cdk.CfnOutput(this, 'ArchiveBucketName', { value: this.archiveBucket.bucketName });
  }
}
