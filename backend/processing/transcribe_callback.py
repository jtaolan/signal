"""
Lambda: signals-transcribe-callback
Triggered by EventBridge when an AWS Transcribe job completes.
Fetches the transcript, updates the content item, triggers brief_generator.
"""
import json
import os
import boto3

s3 = boto3.client('s3')
lambda_client = boto3.client('lambda')
dynamo = boto3.resource('dynamodb')

AUDIO_BUCKET = os.environ['S3_BUCKET_AUDIO']
CONTENT_TABLE = os.environ['DYNAMO_TABLE_CONTENT']


def handler(event, context):
    # EventBridge detail from Transcribe job state change
    detail = event.get('detail', {})
    job_name = detail.get('TranscriptionJobName', '')
    status = detail.get('TranscriptionJobStatus', '')

    if status != 'COMPLETED':
        print(f"Job {job_name} status: {status} — skipping")
        return

    if not job_name.startswith('signals-'):
        return

    content_id = job_name.replace('signals-', '', 1)
    transcript_key = f"transcripts/{content_id}.json"

    # Fetch transcript from S3
    try:
        obj = s3.get_object(Bucket=AUDIO_BUCKET, Key=transcript_key)
        transcript_data = json.loads(obj['Body'].read())
        transcript_text = transcript_data['results']['transcripts'][0]['transcript']
    except Exception as e:
        print(f"Failed to fetch transcript for {content_id}: {e}")
        return

    # Update content item with raw text
    content_table = dynamo.Table(CONTENT_TABLE)
    content_table.update_item(
        Key={'contentId': content_id},
        UpdateExpression='SET rawText = :t, #s = :s',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={':t': transcript_text, ':s': 'pending'}
    )
    print(f"Transcript saved for {content_id}, length={len(transcript_text)}")

    # Trigger brief generation
    lambda_client.invoke(
        FunctionName='signals-brief-generator',
        InvocationType='Event',
        Payload=json.dumps({'contentId': content_id})
    )
