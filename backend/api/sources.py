"""
Lambda: signals-api-sources (admin only)
GET    /sources         — list all sources
POST   /sources         — add new source
PUT    /sources/{id}    — update source
DELETE /sources/{id}    — delete source
"""
import json
import os
import uuid
import boto3
from datetime import datetime, timezone

dynamo = boto3.resource('dynamodb')
SOURCES_TABLE = os.environ['DYNAMO_TABLE_SOURCES']

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json',
}

VALID_TYPES = {'rss', 'scrape', 'podcast'}
VALID_THEMES = {
    'accessibility_title2', 'ai_governance',
    'curriculum_accreditation', 'student_success', ''
}


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    path_params = event.get('pathParameters') or {}
    source_id = path_params.get('id')

    sources_table = dynamo.Table(SOURCES_TABLE)

    if method == 'GET':
        resp = sources_table.scan()
        items = sorted(resp.get('Items', []), key=lambda x: x.get('name', ''))
        return _ok({'sources': items})

    elif method == 'POST':
        body = json.loads(event.get('body') or '{}')
        name = (body.get('name') or '').strip()
        url = (body.get('url') or '').strip()
        src_type = body.get('type', 'rss')
        theme_hint = body.get('theme_hint', '')

        if not name or not url:
            return _err(400, 'name and url are required')
        if src_type not in VALID_TYPES:
            return _err(400, f'type must be one of: {", ".join(VALID_TYPES)}')

        item = {
            'sourceId': str(uuid.uuid4()),
            'name': name,
            'url': url,
            'type': src_type,
            'theme_hint': theme_hint,
            'enabled': True,
            'createdAt': datetime.now(timezone.utc).isoformat(),
        }
        sources_table.put_item(Item=item)
        return _ok(item, status=201)

    elif method == 'PUT' and source_id:
        body = json.loads(event.get('body') or '{}')
        updates = []
        values = {}
        names = {}
        for field in ('name', 'url', 'type', 'theme_hint', 'enabled'):
            if field in body:
                safe = f'#f{len(updates)}'
                names[safe] = field
                values[f':v{len(updates)}'] = body[field]
                updates.append(f'{safe} = :v{len(updates)-1}')
        if not updates:
            return _err(400, 'No valid fields to update')

        sources_table.update_item(
            Key={'sourceId': source_id},
            UpdateExpression='SET ' + ', '.join(updates),
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=values,
        )
        return _ok({'updated': source_id})

    elif method == 'DELETE' and source_id:
        sources_table.delete_item(Key={'sourceId': source_id})
        return _ok({'deleted': source_id})

    return _err(405, 'Method not allowed')


def _ok(body, status=200):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(body, default=str)}

def _err(status, msg):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps({'error': msg})}
