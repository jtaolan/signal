import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';

interface ComputeStackProps extends cdk.StackProps {
  audioBucket: s3.Bucket;
  archiveBucket: s3.Bucket;
  sourcesTable: dynamodb.Table;
  contentTable: dynamodb.Table;
  briefsTable: dynamodb.Table;
  subscriptionsTable: dynamodb.Table;
}

export class ComputeStack extends cdk.Stack {
  public readonly ingestionFunction: lambda.Function;
  public readonly tavilyFunction: lambda.Function;
  public readonly digestFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const commonEnv = {
      DYNAMO_TABLE_SOURCES: props.sourcesTable.tableName,
      DYNAMO_TABLE_CONTENT: props.contentTable.tableName,
      DYNAMO_TABLE_BRIEFS: props.briefsTable.tableName,
      DYNAMO_TABLE_SUBSCRIPTIONS: props.subscriptionsTable.tableName,
      S3_BUCKET_AUDIO: props.audioBucket.bucketName,
      S3_BUCKET_ARCHIVE: props.archiveBucket.bucketName,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      TAVILY_API_KEY: process.env.TAVILY_API_KEY ?? '',
      SES_FROM_EMAIL: process.env.SES_FROM_EMAIL ?? 'signals@example.com',
      FRONTEND_URL: process.env.FRONTEND_URL ?? 'https://signals.example.com',
    };

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant permissions
    props.audioBucket.grantReadWrite(lambdaRole);
    props.archiveBucket.grantReadWrite(lambdaRole);
    props.sourcesTable.grantReadWriteData(lambdaRole);
    props.contentTable.grantReadWriteData(lambdaRole);
    props.briefsTable.grantReadWriteData(lambdaRole);
    props.subscriptionsTable.grantReadWriteData(lambdaRole);
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['transcribe:StartTranscriptionJob', 'transcribe:GetTranscriptionJob'],
      resources: ['*'],
    }));
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: ['*'],
    }));

    const depsLayer = new lambda.LayerVersion(this, 'DepsLayer', {
      layerVersionName: 'signals-deps',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/layers/common')),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
      description: 'anthropic, feedparser, trafilatura',
    });

    const commonLambdaProps = {
      runtime: lambda.Runtime.PYTHON_3_12,
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: commonEnv,
      layers: [depsLayer],
    };

    // --- Ingestion functions ---
    this.ingestionFunction = new lambda.Function(this, 'RssFetcher', {
      ...commonLambdaProps,
      functionName: 'signals-rss-fetcher',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/ingestion')),
      handler: 'rss_fetcher.handler',
      timeout: cdk.Duration.minutes(10),
    });

    this.tavilyFunction = new lambda.Function(this, 'TavilyFetcher', {
      ...commonLambdaProps,
      functionName: 'signals-tavily-fetcher',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/ingestion')),
      handler: 'tavily_fetcher.handler',
      timeout: cdk.Duration.minutes(10),
    });

    new lambda.Function(this, 'PodcastDownloader', {
      ...commonLambdaProps,
      functionName: 'signals-podcast-downloader',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/ingestion')),
      handler: 'podcast_downloader.handler',
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
    });

    // --- Processing functions ---
    new lambda.Function(this, 'TranscribeCallback', {
      ...commonLambdaProps,
      functionName: 'signals-transcribe-callback',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/processing')),
      handler: 'transcribe_callback.handler',
    });

    new lambda.Function(this, 'BriefGenerator', {
      ...commonLambdaProps,
      functionName: 'signals-brief-generator',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/processing')),
      handler: 'brief_generator.handler',
      timeout: cdk.Duration.minutes(10),
    });

    // --- Distribution ---
    this.digestFunction = new lambda.Function(this, 'EmailDigest', {
      ...commonLambdaProps,
      functionName: 'signals-email-digest',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/distribution')),
      handler: 'email_digest.handler',
      timeout: cdk.Duration.minutes(10),
    });

    // --- API functions ---
    const feedsFunction = new lambda.Function(this, 'FeedsApi', {
      ...commonLambdaProps,
      functionName: 'signals-api-feeds',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/api')),
      handler: 'feeds.handler',
      timeout: cdk.Duration.seconds(30),
    });

    const briefsFunction = new lambda.Function(this, 'BriefsApi', {
      ...commonLambdaProps,
      functionName: 'signals-api-briefs',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/api')),
      handler: 'briefs.handler',
      timeout: cdk.Duration.seconds(30),
    });

    const subscriptionsFunction = new lambda.Function(this, 'SubscriptionsApi', {
      ...commonLambdaProps,
      functionName: 'signals-api-subscriptions',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/api')),
      handler: 'subscriptions.handler',
      timeout: cdk.Duration.seconds(30),
    });

    const sourcesAdminFunction = new lambda.Function(this, 'SourcesAdminApi', {
      ...commonLambdaProps,
      functionName: 'signals-api-sources',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/api')),
      handler: 'sources.handler',
      timeout: cdk.Duration.seconds(30),
    });

    // --- API Gateway ---
    const api = new apigateway.RestApi(this, 'SignalsApi', {
      restApiName: 'signals-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const feedsResource = api.root.addResource('feeds');
    feedsResource.addMethod('GET', new apigateway.LambdaIntegration(feedsFunction));

    const briefsResource = api.root.addResource('briefs');
    briefsResource.addMethod('GET', new apigateway.LambdaIntegration(briefsFunction));
    const briefItem = briefsResource.addResource('{id}');
    briefItem.addMethod('GET', new apigateway.LambdaIntegration(briefsFunction));

    const subsResource = api.root.addResource('subscriptions');
    subsResource.addMethod('POST', new apigateway.LambdaIntegration(subscriptionsFunction));
    const subItem = subsResource.addResource('{token}');
    subItem.addMethod('DELETE', new apigateway.LambdaIntegration(subscriptionsFunction));

    const sourcesResource = api.root.addResource('sources');
    sourcesResource.addMethod('GET', new apigateway.LambdaIntegration(sourcesAdminFunction));
    sourcesResource.addMethod('POST', new apigateway.LambdaIntegration(sourcesAdminFunction));
    const sourceItem = sourcesResource.addResource('{id}');
    sourceItem.addMethod('PUT', new apigateway.LambdaIntegration(sourcesAdminFunction));
    sourceItem.addMethod('DELETE', new apigateway.LambdaIntegration(sourcesAdminFunction));

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}
