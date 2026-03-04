"""
Lambda: signals-api-feeds
GET /feeds?theme=ai_governance&limit=20&cursor=...
Returns paginated list of published briefs for a theme (or all themes).
"""
import json
import os
import boto3
from boto3.dynamodb.conditions import Key, Attr

dynamo = boto3.resource('dynamodb')
BRIEFS_TABLE = os.environ['DYNAMO_TABLE_BRIEFS']

VALID_THEMES = {
    'accessibility_title2', 'ai_governance',
    'curriculum_accreditation', 'student_success'
}

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}


def handler(event, context):
    params = event.get('queryStringParameters') or {}
    theme = params.get('theme', '')
    limit = min(int(params.get('limit', 20)), 50)
    cursor = params.get('cursor')

    briefs_table = dynamo.Table(BRIEFS_TABLE)

    try:
        if theme and theme in VALID_THEMES:
            query_kwargs = {
                'IndexName': 'theme-createdAt-index',
                'KeyConditionExpression': Key('theme').eq(theme),
                'FilterExpression': Attr('published').eq(True),
                'ScanIndexForward': False,  # newest first
                'Limit': limit,
            }
            if cursor:
                query_kwargs['ExclusiveStartKey'] = json.loads(cursor)
            resp = briefs_table.query(**query_kwargs)
        else:
            # Return all themes — scan with filter, paginated
            scan_kwargs = {
                'FilterExpression': Attr('published').eq(True),
                'Limit': limit,
            }
            if cursor:
                scan_kwargs['ExclusiveStartKey'] = json.loads(cursor)
            resp = briefs_table.scan(**scan_kwargs)

        items = resp.get('Items', [])
        next_cursor = None
        if 'LastEvaluatedKey' in resp:
            next_cursor = json.dumps(resp['LastEvaluatedKey'])

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'briefs': items,
                'cursor': next_cursor,
                'count': len(items),
            }, default=str),
        }
    except Exception as e:
        print(f"Error fetching feeds: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)}),
        }
