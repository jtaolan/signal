"""
Lambda: signals-tavily-fetcher
Scans signals-sources for type='tavily' enabled sources.
Each source's `url` field is used as a search query.
Calls Tavily API to find relevant articles across the web,
deduplicates, stores to signals-content, and triggers brief_generator.
"""
import json
import os
import hashlib
import boto3
from datetime import datetime, timezone
from tavily import TavilyClient

dynamo = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

SOURCES_TABLE = os.environ['DYNAMO_TABLE_SOURCES']
CONTENT_TABLE = os.environ['DYNAMO_TABLE_CONTENT']
TAVILY_API_KEY = os.environ['TAVILY_API_KEY']


def handler(event, context):
    sources_table = dynamo.Table(SOURCES_TABLE)
    content_table = dynamo.Table(CONTENT_TABLE)

    resp = sources_table.scan(
        FilterExpression='enabled = :v AND #t = :type',
        ExpressionAttributeNames={'#t': 'type'},
        ExpressionAttributeValues={':v': True, ':type': 'tavily'}
    )
    sources = resp.get('Items', [])
    print(f"Processing {len(sources)} Tavily search sources")

    client = TavilyClient(api_key=TAVILY_API_KEY)
    ingested = 0

    for source in sources:
        query = source.get('url', '')  # url field holds the search query
        source_id = source['sourceId']
        theme_hint = source.get('theme_hint', '')

        if not query:
            continue

        try:
            results = client.search(
                query=query,
                search_depth='advanced',
                max_results=10,
                include_raw_content=True,
            )
        except Exception as e:
            print(f"Tavily search failed for query '{query}': {e}")
            continue

        for result in results.get('results', []):
            article_url = result.get('url', '')
            raw_content = result.get('raw_content') or result.get('content', '')
            title = result.get('title', '')

            if not article_url or not raw_content or len(raw_content) < 100:
                continue

            url_hash = hashlib.sha256(article_url.encode()).hexdigest()[:16]
            content_id = f"{source_id[:8]}-{url_hash}"

            existing = content_table.get_item(Key={'contentId': content_id}).get('Item')
            if existing:
                continue

            item = {
                'contentId': content_id,
                'sourceId': source_id,
                'sourceName': source.get('name', ''),
                'sourceUrl': article_url,
                'title': title,
                'rawText': raw_content[:50000],
                'type': 'article',
                'status': 'pending',
                'themeHint': theme_hint,
                'createdAt': datetime.now(timezone.utc).isoformat(),
            }
            content_table.put_item(Item=item)
            ingested += 1

            lambda_client.invoke(
                FunctionName='signals-brief-generator',
                InvocationType='Event',
                Payload=json.dumps({'contentId': content_id})
            )

        sources_table.update_item(
            Key={'sourceId': source_id},
            UpdateExpression='SET last_ingested = :ts',
            ExpressionAttributeValues={':ts': datetime.now(timezone.utc).isoformat()}
        )

    print(f"Ingested {ingested} new items from Tavily")
    return {'statusCode': 200, 'ingested': ingested}
