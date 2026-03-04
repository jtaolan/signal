"""
Lambda: signals-rss-fetcher
Triggered by EventBridge daily. Reads enabled RSS/podcast sources from DynamoDB,
fetches new items, deduplicates, saves to signals-content, and chains to brief_generator.
"""
import json
import os
import uuid
import hashlib
import boto3
import feedparser
import urllib.request
from datetime import datetime, timezone

dynamo = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

SOURCES_TABLE = os.environ['DYNAMO_TABLE_SOURCES']
CONTENT_TABLE = os.environ['DYNAMO_TABLE_CONTENT']


def handler(event, context):
    sources_table = dynamo.Table(SOURCES_TABLE)
    content_table = dynamo.Table(CONTENT_TABLE)

    # Scan enabled sources (small table, scan is fine)
    resp = sources_table.scan(
        FilterExpression='enabled = :v',
        ExpressionAttributeValues={':v': True}
    )
    sources = resp.get('Items', [])
    print(f"Processing {len(sources)} sources")

    ingested = 0
    for source in sources:
        if source.get('type') == 'podcast':
            _process_podcast_source(source, content_table)
        else:
            ingested += _process_rss_source(source, content_table)

        # Update last_ingested timestamp
        sources_table.update_item(
            Key={'sourceId': source['sourceId']},
            UpdateExpression='SET last_ingested = :ts',
            ExpressionAttributeValues={':ts': datetime.now(timezone.utc).isoformat()}
        )

    print(f"Ingested {ingested} new items")
    return {'statusCode': 200, 'ingested': ingested}


def _process_rss_source(source: dict, content_table) -> int:
    url = source['url']
    source_id = source['sourceId']
    try:
        feed = feedparser.parse(url)
    except Exception as e:
        print(f"Failed to parse RSS {url}: {e}")
        return 0

    count = 0
    for entry in feed.entries[:20]:  # cap at 20 newest per run
        item_url = entry.get('link', '')
        if not item_url:
            continue

        # Deduplicate by URL hash
        url_hash = hashlib.sha256(item_url.encode()).hexdigest()[:16]
        content_id = f"{source_id[:8]}-{url_hash}"

        # Check if already processed
        existing = content_table.get_item(Key={'contentId': content_id}).get('Item')
        if existing:
            continue

        # Extract text: use summary/content from feed
        raw_text = _extract_feed_text(entry)
        if not raw_text or len(raw_text) < 100:
            continue

        item = {
            'contentId': content_id,
            'sourceId': source_id,
            'sourceName': source.get('name', ''),
            'sourceUrl': item_url,
            'title': entry.get('title', ''),
            'rawText': raw_text[:50000],  # cap at 50k chars
            'type': 'article',
            'status': 'pending',
            'themeHint': source.get('theme_hint', ''),
            'createdAt': datetime.now(timezone.utc).isoformat(),
        }
        content_table.put_item(Item=item)
        count += 1

        # Immediately trigger brief generation
        lambda_client.invoke(
            FunctionName='signals-brief-generator',
            InvocationType='Event',  # async
            Payload=json.dumps({'contentId': content_id})
        )

    return count


def _process_podcast_source(source: dict, content_table):
    """For podcast RSS feeds, trigger podcast_downloader for each new episode."""
    url = source['url']
    try:
        feed = feedparser.parse(url)
    except Exception as e:
        print(f"Failed to parse podcast RSS {url}: {e}")
        return

    for entry in feed.entries[:5]:  # limit episodes per run
        audio_url = _find_audio_url(entry)
        if not audio_url:
            continue

        url_hash = hashlib.sha256(audio_url.encode()).hexdigest()[:16]
        content_id = f"{source['sourceId'][:8]}-{url_hash}"

        existing = content_table.get_item(Key={'contentId': content_id}).get('Item')
        if existing:
            continue

        # Trigger async podcast downloader
        lambda_client.invoke(
            FunctionName='signals-podcast-downloader',
            InvocationType='Event',
            Payload=json.dumps({
                'contentId': content_id,
                'audioUrl': audio_url,
                'sourceId': source['sourceId'],
                'sourceName': source.get('name', ''),
                'title': entry.get('title', ''),
                'themeHint': source.get('theme_hint', ''),
            })
        )


def _extract_feed_text(entry) -> str:
    # Try content first (full text), then summary
    if hasattr(entry, 'content') and entry.content:
        return entry.content[0].get('value', '')
    if hasattr(entry, 'summary'):
        return entry.summary
    return ''


def _find_audio_url(entry) -> str:
    for enclosure in getattr(entry, 'enclosures', []):
        if 'audio' in enclosure.get('type', ''):
            return enclosure.get('href', '')
    return ''
