import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface SchedulerStackProps extends cdk.StackProps {
  ingestionFunction: lambda.Function;
  digestFunction: lambda.Function;
}

export class SchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SchedulerStackProps) {
    super(scope, id, props);

    // Daily ingestion at 9am ET (14:00 UTC)
    new events.Rule(this, 'DailyIngestion', {
      ruleName: 'signals-daily-ingestion',
      schedule: events.Schedule.cron({ minute: '0', hour: '14', weekDay: 'MON-FRI' }),
      targets: [new targets.LambdaFunction(props.ingestionFunction)],
      description: 'Trigger RSS/podcast ingestion on weekday mornings',
    });

    // Weekly digest every Monday at 7am ET (12:00 UTC)
    new events.Rule(this, 'WeeklyDigest', {
      ruleName: 'signals-weekly-digest',
      schedule: events.Schedule.cron({ minute: '0', hour: '12', weekDay: 'MON' }),
      targets: [new targets.LambdaFunction(props.digestFunction)],
      description: 'Send weekly decision brief digests to subscribers',
    });
  }
}
