import re
import os
from datetime import datetime
from typing import List, Dict, Any

PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r'reveal\s+(your\s+)?(system|hidden|internal|secret)\s+(prompt|instructions|directives|configuration)', re.I), 'System prompt extraction'),
    (re.compile(r'show\s+(your\s+)?(system|hidden|internal|secret)\s+(prompt|instructions|directives|configuration)', re.I), 'System prompt extraction'),
    (re.compile(r'print\s+(your\s+)?(system|hidden|internal|secret)\s+(prompt|instructions|directives)', re.I), 'System prompt extraction'),
    (re.compile(r'(developer|admin)\s*(instructions?|mode|override|directives)', re.I), 'Developer instructions extraction'),
    (re.compile(r'(hidden|secret|private)\s+(prompt|instructions?|message|directives)', re.I), 'Hidden prompt extraction'),
    (re.compile(r'reveal\s+(configuration|api[\s_]*key|credentials?|secrets?)', re.I), 'Configuration extraction'),
    (re.compile(r'show\s+(environment\s+variables?|env\s*vars?|api[\s_]*key|secrets?|credentials?|tokens?)', re.I), 'Environment variable extraction'),
    (re.compile(r'print\s+(secrets?|environment\s+variables?|env\s*vars?|api[\s_]*key)', re.I), 'Secret extraction'),
    (re.compile(r'\bjailbreak\b', re.I), 'Jailbreak attempt'),
    (re.compile(r'\bDAN\b', re.I), 'DAN jailbreak'),
    (re.compile(r'ignore\s+(previous|all|current|your)\s+(instructions|prompts|directives|commands)', re.I), 'Prompt injection'),
    (re.compile(r'override\s+(instructions?|prompts?|directives|rules|safety)', re.I), 'Override attempt'),
]

BLOCK_RESPONSE = "Sorry, I cannot provide internal instructions, system prompts, credentials, or protected configuration details."

LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'safety.log')


def check_messages(messages: List[Dict[str, Any]]) -> str | None:
    """Check all user messages for safety violations. Returns block message if found, None if safe."""
    for msg in messages:
        if msg.get('role') != 'user':
            continue
        parts = msg.get('parts', [])
        for part in parts:
            text = part.get('text', '')
            for pattern, reason in PATTERNS:
                if pattern.search(text):
                    _log_block(text, reason)
                    return BLOCK_RESPONSE
    return None


def _log_block(prompt: str, reason: str) -> None:
    """Log blocked attempt to file."""
    try:
        timestamp = datetime.now().isoformat()
        truncated = prompt[:150] + '…' if len(prompt) > 150 else prompt
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(f'[{timestamp}] BLOCKED | {reason} | "{truncated}"\n')
    except Exception:
        pass
