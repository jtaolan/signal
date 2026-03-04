"""
Lambda: signals-podcast-downloader
Downloads a podcast audio file to S3, starts an AWS Transcribe job.
Triggered async by rss_fetcher.
"""
import os
import json
import boto3
import urllib.request
from datetime import datetime, timezone

s3 = boto3.client('s3')
transcribe = boto3.client('transcribe')
dynamo = boto3.resource('dynamodb')

AUDIO_BUCKET = os.environ['S3_BUCKET_AUDIO']
CONTENT_TABLE = os.environ['DYNAMO_TABLE_CONTENT']


def handler(event, context):
    content_id = event['contentId']
    audio_url = event['audioUrl']
    source_id = event['sourceId']
    source_name = event.get('sourceName', '')
    title = event.get('title', '')
    theme_hint = event.get('themeHint', '')

    content_table = dynamo.Table(CONTENT_TABLE)
    s3_key = f"audio/{content_id}.mp3"

    print(f"Downloading audio for {content_id}: {audio_url}")

    # Download audio to /tmp, upload to S3
    tmp_path = f"/tmp/{content_id}.mp3"
    try:
        req = urllib.request.Request(audio_url, headers={'User-Agent': 'Signals/1.0'})
        with urllib.request.urlopen(req, timeout=300) as response:
            with open(tmp_path, 'wb') as f:
                while chunk := response.read(65536):
                    f.write(chunk)
    except Exception as e:
        print(f"Download failed for {audio_url}: {e}")
        return

    s3.upload_file(tmp_path, AUDIO_BUCKET, s3_key)
    print(f"Uploaded to s3://{AUDIO_BUCKET}/{s3_key}")

    # Start Transcribe job
    job_name = f"signals-{content_id}"
    try:
        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': f"s3://{AUDIO_BUCKET}/{s3_key}"},
            MediaFormat='mp3',
            LanguageCode='en-US',
            OutputBucketName=AUDIO_BUCKET,
            OutputKey=f"transcripts/{content_id}.json",
        )
    except Exception as e:
        print(f"Transcribe job failed: {e}")
        return

    # Save content item
    content_table.put_item(Item={
        'contentId': content_id,
        'sourceId': source_id,
        'sourceName': source_name,
        'title': title,
        'audioS3Key': s3_key,
        'transcribeJobName': job_name,
        'type': 'podcast',
        'status': 'transcribing',
        'themeHint': theme_hint,
        'createdAt': datetime.now(timezone.utc).isoformat(),
    })
    print(f"Content item saved, transcription started: {job_name}")
