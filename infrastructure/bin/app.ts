#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StorageStack } from '../stacks/storage-stack';
import { ComputeStack } from '../stacks/compute-stack';
import { SchedulerStack } from '../stacks/scheduler-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const storageStack = new StorageStack(app, 'SignalsStorageStack', { env });
const computeStack = new ComputeStack(app, 'SignalsComputeStack', {
  env,
  audioBucket: storageStack.audioBucket,
  archiveBucket: storageStack.archiveBucket,
  sourcesTable: storageStack.sourcesTable,
  contentTable: storageStack.contentTable,
  briefsTable: storageStack.briefsTable,
  subscriptionsTable: storageStack.subscriptionsTable,
});
new SchedulerStack(app, 'SignalsSchedulerStack', {
  env,
  ingestionFunction: computeStack.ingestionFunction,
  tavilyFunction: computeStack.tavilyFunction,
  digestFunction: computeStack.digestFunction,
});
