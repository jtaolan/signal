"""
Lambda: signals-email-digest
Triggered by EventBridge weekly (Monday 7am ET).
Queries last 7 days of published briefs per theme, renders HTML email,
sends to all subscribers of that theme via SES.
"""
import json
import os
import boto3
from datetime import datetime, timezone, timedelta
from boto3.dynamodb.conditions import Key, Attr

dynamo = boto3.resource('dynamodb')
ses = boto3.client('ses', region_name='us-east-1')

BRIEFS_TABLE = os.environ['DYNAMO_TABLE_BRIEFS']
SUBS_TABLE = os.environ['DYNAMO_TABLE_SUBSCRIPTIONS']
FROM_EMAIL = os.environ['SES_FROM_EMAIL']
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://signals.example.com')

THEMES = {
    'accessibility_title2': 'Accessibility & Title II Compliance',
    'ai_governance': 'AI in Higher Ed Governance',
    'curriculum_accreditation': 'Curriculum / Accreditation / AoL',
    'student_success': 'Student Success & Learning Analytics',
}


def handler(event, context):
    briefs_table = dynamo.Table(BRIEFS_TABLE)
    subs_table = dynamo.Table(SUBS_TABLE)

    since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    sent_count = 0

    for theme_key, theme_label in THEMES.items():
        # Get recent briefs for this theme
        resp = briefs_table.query(
            IndexName='theme-createdAt-index',
            KeyConditionExpression=Key('theme').eq(theme_key) & Key('createdAt').gte(since),
            FilterExpression=Attr('published').eq(True),
            ScanIndexForward=False,
        )
        briefs = resp.get('Items', [])
        if not briefs:
            print(f"No new briefs for {theme_key}, skipping")
            continue

        # Get subscribers for this theme
        subs_resp = subs_table.scan()
        subscribers = [
            item for item in subs_resp.get('Items', [])
            if theme_key in item.get('themes', [])
        ]
        if not subscribers:
            print(f"No subscribers for {theme_key}")
            continue

        html = _render_digest_html(theme_label, briefs, theme_key)
        subject = f"Signals Weekly: {theme_label} — {len(briefs)} new brief{'s' if len(briefs) != 1 else ''}"

        for sub in subscribers:
            email = sub['email']
            token = sub.get('unsubscribeToken', '')
            unsubscribe_url = f"{FRONTEND_URL}/unsubscribe?token={token}"
            personalized_html = html.replace('{{UNSUBSCRIBE_URL}}', unsubscribe_url)

            try:
                ses.send_email(
                    Source=FROM_EMAIL,
                    Destination={'ToAddresses': [email]},
                    Message={
                        'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                        'Body': {'Html': {'Data': personalized_html, 'Charset': 'UTF-8'}},
                    },
                )
                sent_count += 1
            except Exception as e:
                print(f"Failed to send to {email}: {e}")

    print(f"Digest complete. Sent {sent_count} emails.")
    return {'sent': sent_count}


def _render_digest_html(theme_label: str, briefs: list, theme_key: str) -> str:
    brief_html = ''
    for b in briefs[:10]:  # cap at 10 per digest
        signals_li = ''.join(f'<li>{s}</li>' for s in b.get('keySignals', []))
        actions_li = ''.join(f'<li>{a}</li>' for a in b.get('actionItems', []))
        brief_url = f"{FRONTEND_URL}/briefs/{b['briefId']}"
        brief_html += f"""
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:20px;">
          <h3 style="margin:0 0 8px;color:#1a202c;">{b.get('title','')}</h3>
          <p style="color:#718096;font-size:13px;margin:0 0 12px;">
            Source: <a href="{b.get('sourceUrl','#')}" style="color:#667eea;">{b.get('sourceName','')}</a>
          </p>
          <p style="color:#4a5568;margin:0 0 12px;">{b.get('summary','')}</p>
          <strong style="color:#2d3748;">Key Signals</strong>
          <ul style="color:#4a5568;padding-left:20px;">{signals_li}</ul>
          <strong style="color:#2d3748;">Action Items</strong>
          <ul style="color:#4a5568;padding-left:20px;">{actions_li}</ul>
          <a href="{brief_url}" style="color:#667eea;font-size:13px;">Read full brief →</a>
        </div>"""

    date_str = datetime.now(timezone.utc).strftime('%B %d, %Y')
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f7fafc;">
  <div style="background:#667eea;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:22px;">Signals Weekly</h1>
    <p style="color:#c3dafe;margin:4px 0 0;font-size:14px;">{theme_label} · {date_str}</p>
  </div>
  <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;">
    <p style="color:#4a5568;">Here are this week's decision briefs for <strong>{theme_label}</strong>.</p>
    {brief_html}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <p style="color:#a0aec0;font-size:12px;text-align:center;">
      <a href="{FRONTEND_URL}/feeds/{theme_key}" style="color:#667eea;">View all briefs online</a> ·
      <a href="{{{{UNSUBSCRIBE_URL}}}}" style="color:#a0aec0;">Unsubscribe</a>
    </p>
  </div>
</body></html>"""
