"""
Lambda: signals-api-briefs
GET /briefs/{id} — fetch single brief by ID
GET /briefs      — list all (with optional filters)
"""
import json
import os
import boto3

dynamo = boto3.resource('dynamodb')
BRIEFS_TABLE = os.environ['DYNAMO_TABLE_BRIEFS']

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}


def handler(event, context):
    brief_id = (event.get('pathParameters') or {}).get('id')
    briefs_table = dynamo.Table(BRIEFS_TABLE)

    try:
        if brief_id:
            item = briefs_table.get_item(Key={'briefId': brief_id}).get('Item')
            if not item:
                return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps(item, default=str),
            }
        else:
            resp = briefs_table.scan(Limit=50)
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({'briefs': resp.get('Items', [])}, default=str),
            }
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': str(e)})}
