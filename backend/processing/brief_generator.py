"""
Lambda: signals-brief-generator
Given a contentId, fetches raw text, calls Claude to:
1. Categorize into one of 4 themes
2. Generate a structured decision brief
Then saves the brief to signals-briefs.
"""
import json
import os
import uuid
import anthropic
import boto3
from datetime import datetime, timezone

dynamo = boto3.resource('dynamodb')

CONTENT_TABLE = os.environ['DYNAMO_TABLE_CONTENT']
BRIEFS_TABLE = os.environ['DYNAMO_TABLE_BRIEFS']
ANTHROPIC_API_KEY = os.environ['ANTHROPIC_API_KEY']

THEMES = {
    'accessibility_title2': 'Accessibility & Title II Compliance',
    'ai_governance': 'AI in Higher Ed Governance',
    'curriculum_accreditation': 'Curriculum / Accreditation / AoL',
    'student_success': 'Student Success & Learning Analytics',
}

CATEGORIZE_PROMPT = """You are classifying higher education content into exactly one of these themes:
- accessibility_title2: Accessibility requirements, ADA, Title II compliance, disability services
- ai_governance: Artificial intelligence policy, AI tools in higher ed, governance, ethics
- curriculum_accreditation: Curriculum design, accreditation, assurance of learning, academic programs
- student_success: Student retention, learning analytics, advising, student outcomes

Given the following content, respond with ONLY the theme key (one of the four above).

Content:
{text}"""

BRIEF_PROMPT = """You are a higher education policy analyst creating concise decision briefs for academic administrators.

Given the following content from "{source_name}", produce a decision brief as a JSON object with exactly these fields:
- "title": A specific, informative title starting with "Decision Brief:" (max 80 chars)
- "summary": 2-3 sentences explaining the core signal and why it matters
- "key_signals": Array of exactly 3 bullet-point strings (the most important takeaways)
- "decision_implications": Array of exactly 2 strings (what this means for institutional decisions)
- "action_items": Array of exactly 2 strings (concrete next steps administrators should consider)

Respond with ONLY valid JSON. No markdown, no explanation.

Content:
{text}"""


def handler(event, context):
    content_id = event['contentId']
    content_table = dynamo.Table(CONTENT_TABLE)
    briefs_table = dynamo.Table(BRIEFS_TABLE)

    # Fetch content item
    item = content_table.get_item(Key={'contentId': content_id}).get('Item')
    if not item:
        print(f"Content item not found: {content_id}")
        return
    if item.get('status') not in ('pending', None):
        print(f"Skipping {content_id}, status={item.get('status')}")
        return

    raw_text = item.get('rawText', '')
    if not raw_text or len(raw_text) < 50:
        print(f"No usable text for {content_id}")
        content_table.update_item(
            Key={'contentId': content_id},
            UpdateExpression='SET #s = :s',
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={':s': 'skipped'}
        )
        return

    # Mark as processing
    content_table.update_item(
        Key={'contentId': content_id},
        UpdateExpression='SET #s = :s',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={':s': 'processing'}
    )

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    truncated_text = raw_text[:8000]  # ~6k tokens, safe for context

    # Step 1: Categorize
    theme = item.get('themeHint', '')
    if theme not in THEMES:
        cat_response = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=20,
            messages=[{'role': 'user', 'content': CATEGORIZE_PROMPT.format(text=truncated_text)}]
        )
        theme = cat_response.content[0].text.strip().lower()
        if theme not in THEMES:
            theme = 'ai_governance'  # fallback
    print(f"Categorized {content_id} as: {theme}")

    # Step 2: Generate brief
    brief_response = client.messages.create(
        model='claude-sonnet-4-6',
        max_tokens=1024,
        messages=[{
            'role': 'user',
            'content': BRIEF_PROMPT.format(
                source_name=item.get('sourceName', 'Unknown Source'),
                text=truncated_text
            )
        }]
    )

    try:
        brief_data = json.loads(brief_response.content[0].text.strip())
    except json.JSONDecodeError as e:
        print(f"JSON parse failed for {content_id}: {e}")
        content_table.update_item(
            Key={'contentId': content_id},
            UpdateExpression='SET #s = :s',
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={':s': 'error'}
        )
        return

    # Save brief
    brief_id = str(uuid.uuid4())
    brief_item = {
        'briefId': brief_id,
        'theme': theme,
        'themeLabel': THEMES[theme],
        'title': brief_data.get('title', 'Decision Brief'),
        'summary': brief_data.get('summary', ''),
        'keySignals': brief_data.get('key_signals', []),
        'decisionImplications': brief_data.get('decision_implications', []),
        'actionItems': brief_data.get('action_items', []),
        'sourceTitle': item.get('title', ''),
        'sourceName': item.get('sourceName', ''),
        'sourceUrl': item.get('sourceUrl', ''),
        'contentId': content_id,
        'contentType': item.get('type', 'article'),
        'published': True,
        'createdAt': datetime.now(timezone.utc).isoformat(),
    }
    briefs_table.put_item(Item=brief_item)

    # Mark content as done
    content_table.update_item(
        Key={'contentId': content_id},
        UpdateExpression='SET #s = :s, briefId = :b',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={':s': 'done', ':b': brief_id}
    )
    print(f"Brief {brief_id} created for {content_id} in theme {theme}")
    return {'briefId': brief_id, 'theme': theme}
