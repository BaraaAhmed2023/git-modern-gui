#!/usr/bin/env python3
import json
import sys
import os
import requests
from typing import Dict, List, Any, Optional
from pathlib import Path

class AICommitGenerator:
    def __init__(self, openrouter_api_key: Optional[str] = None):
        self.api_key = openrouter_api_key or os.getenv('OPENROUTER_API_KEY')
        self.base_url = "https://openrouter.ai/api/v1"

    def generate_commit_message(self, changes: List[Dict[str, str]]) -> Dict[str, Any]:
        """Generate AI commit message using OpenRouter API."""

        if not self.api_key:
            return {
                'success': False,
                'error': 'OpenRouter API key not found. Set OPENROUTER_API_KEY environment variable.',
                'message': None
            }

        # Format changes for the prompt
        change_summary = []
        for change in changes:
            status = change.get('status', 'M')
            file_path = change.get('file', '')
            status_text = {
                'A': 'Added',
                'M': 'Modified',
                'D': 'Deleted',
                'R': 'Renamed'
            }.get(status, 'Modified')

            change_summary.append(f"- {status_text}: {file_path}")

        changes_text = '\n'.join(change_summary)

        # Create the prompt
        prompt = f"""Generate a concise, professional Git commit message based on these changes:

{changes_text}

The commit message should:
1. Start with a conventional commit type (feat, fix, docs, style, refactor, perf, test, chore)
2. Be clear and descriptive
3. Focus on the "why" not just the "what"
4. Be under 72 characters for the title
5. Include a brief body if necessary

Provide only the commit message, no explanations."""

        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Modern Git GUI'
            }

            data = {
                'model': 'openai/gpt-3.5-turbo',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are a helpful assistant that generates professional Git commit messages.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': 0.7,
                'max_tokens': 150
            }

            response = requests.post(
                f'{self.base_url}/chat/completions',
                headers=headers,
                json=data,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                message = result['choices'][0]['message']['content'].strip()

                # Clean up the message
                message = message.replace('```', '').strip()
                if message.startswith('"') and message.endswith('"'):
                    message = message[1:-1]

                return {
                    'success': True,
                    'message': message,
                    'model': result.get('model', 'unknown'),
                    'usage': result.get('usage', {})
                }
            else:
                return {
                    'success': False,
                    'error': f'API error: {response.status_code} - {response.text}',
                    'message': None
                }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': None
            }

    def generate_fallback_message(self, changes: List[Dict[str, str]]) -> str:
        """Generate a simple commit message without AI."""
        added = sum(1 for c in changes if c.get('status') == 'A')
        modified = sum(1 for c in changes if c.get('status') == 'M')
        deleted = sum(1 for c in changes if c.get('status') == 'D')

        parts = []
        if added > 0:
            parts.append(f"Add {added} file{'s' if added > 1 else ''}")
        if modified > 0:
            parts.append(f"Update {modified} file{'s' if modified > 1 else ''}")
        if deleted > 0:
            parts.append(f"Remove {deleted} file{'s' if deleted > 1 else ''}")

        if parts:
            return f"feat: {', '.join(parts)}"
        else:
            return "chore: Update files"

def main():
    if len(sys.argv) < 3:
        print(json.dumps({
            'success': False,
            'error': 'Missing arguments: repo_path changes_json',
            'message': None
        }))
        sys.exit(1)

    repo_path = sys.argv[1]
    changes_json = sys.argv[2]

    try:
        changes = json.loads(changes_json)

        # Initialize generator
        generator = AICommitGenerator()

        # Try to generate AI commit
        result = generator.generate_commit_message(changes)

        # Fallback to simple message if AI fails
        if not result['success']:
            fallback_message = generator.generate_fallback_message(changes)
            result = {
                'success': True,
                'message': fallback_message,
                'model': 'fallback',
                'usage': {},
                'warning': 'Using fallback message: ' + result.get('error', '')
            }

        print(json.dumps(result))

    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'error': f'Invalid JSON: {str(e)}',
            'message': None
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'message': None
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()