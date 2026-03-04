"""
Lambda: signals-api-subscriptions
POST /subscriptions       — subscribe email to themes
DELETE /subscriptions/{token} — unsubscribe via token
"""
import json
import os
import uuid
import boto3
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key

dynamo = boto3.resource('dynamodb')
SUBS_TABLE = os.environ['DYNAMO_TABLE_SUBSCRIPTIONS']
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://signals.example.com')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}

VALID_THEMES = {
    'accessibility_title2', 'ai_governance',
    'curriculum_accreditation', 'student_success'
}


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    path_params = event.get('pathParameters') or {}

    if method == 'POST':
        return _subscribe(event)
    elif method == 'DELETE':
        return _unsubscribe(path_params.get('token', ''))
    return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}


def _subscribe(event):
    try:
        body = json.loads(event.get('body') or '{}')
        email = (body.get('email') or '').strip().lower()
        themes = [t for t in body.get('themes', []) if t in VALID_THEMES]

        if not email or '@' not in email:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Valid email required'})}
        if not themes:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'At least one theme required'})}

        subs_table = dynamo.Table(SUBS_TABLE)
        token = str(uuid.uuid4())

        subs_table.put_item(Item={
            'email': email,
            'themes': themes,
            'unsubscribeToken': token,
            'confirmedAt': datetime.now(timezone.utc).isoformat(),
        })

        return {
            'statusCode': 201,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': f'Subscribed {email} to {len(themes)} theme(s)',
                'unsubscribeUrl': f'{FRONTEND_URL}/unsubscribe?token={token}',
            }),
        }
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': str(e)})}


def _unsubscribe(token: str):
    if not token:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Token required'})}

    subs_table = dynamo.Table(SUBS_TABLE)
    try:
        resp = subs_table.query(
            IndexName='unsubscribeToken-index',
            KeyConditionExpression=Key('unsubscribeToken').eq(token)
        )
        items = resp.get('Items', [])
        if not items:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Token not found'})}

        email = items[0]['email']
        subs_table.delete_item(Key={'email': email})
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': f'Unsubscribed {email}'}),
        }
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': str(e)})}
