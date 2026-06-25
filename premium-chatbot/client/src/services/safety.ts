const patterns: { regex: RegExp; description: string }[] = [
  { regex: /ignore\s+(previous|all|current|your|all\s+previous)\s+(instructions|prompts|directives|messages|commands)/i, description: 'Prompt injection' },
  { regex: /reveal\s+(your\s+)?(system|hidden|internal|secret)\s+(prompt|instructions|directives|configuration|message)/i, description: 'System prompt extraction' },
  { regex: /show\s+(your\s+)?(hidden|internal|system|secret)\s+(prompt|instructions|directives|message)/i, description: 'System prompt extraction' },
  { regex: /output\s+(your\s+)?(system|hidden|internal)\s+(prompt|instructions)/i, description: 'System prompt extraction' },
  { regex: /developer\s*mode/i, description: 'Developer mode jailbreak' },
  { regex: /\bDAN\b/i, description: 'DAN jailbreak' },
  { regex: /\bjailbreak\b/i, description: 'Jailbreak attempt' },
  { regex: /print\s+(environment\s+)?(variables|secrets|keys|config|configuration)/i, description: 'Secret extraction' },
  { regex: /show\s+(api\s*key|secret|password|token|credential)/i, description: 'Credential extraction' },
  { regex: /act\s+as\s+(an?\s+)?(unrestricted|unfiltered|unlimited|free|uncensored|another)\s+AI/i, description: 'Jailbreak roleplay' },
  { regex: /you\s+(are|should)\s+(now\s+)?(free|unrestricted|unfiltered|open|no\s+(rules|limits|restrictions|guardrails))/i, description: 'Jailbreak attempt' },
  { regex: /ignore\s+(safety|security|ethics|boundaries)/i, description: 'Safety override attempt' },
  { regex: /from\s+(now\s+)?on\s*,\s*you\s+(are|will|should)/i, description: 'Identity override attempt' },
];

export interface SafetyResult {
  safe: boolean;
  reason?: string;
}

export function validatePrompt(prompt: string): SafetyResult {
  for (const { regex, description } of patterns) {
    if (regex.test(prompt)) {
      logBlocked(prompt, description);
      return { safe: false, reason: description };
    }
  }
  return { safe: true };
}

function logBlocked(prompt: string, reason: string) {
  try {
    const stored = JSON.parse(localStorage.getItem('nexaSafetyLog') || '[]');
    stored.push({
      prompt: prompt.length > 120 ? prompt.slice(0, 120) + '…' : prompt,
      reason,
      timestamp: new Date().toISOString(),
    });
    if (stored.length > 50) stored.splice(0, stored.length - 50);
    localStorage.setItem('nexaSafetyLog', JSON.stringify(stored));
  } catch {
    localStorage.removeItem('nexaSafetyLog');
  }
}

export const safetyFeatures = [
  { id: 'injection', label: 'Prompt Injection Protection' },
  { id: 'jailbreak', label: 'Jailbreak Detection' },
  { id: 'sysprompt', label: 'System Prompt Protection' },
  { id: 'secrets', label: 'Secret & Credential Protection' },
];

export const BLOCK_MESSAGE = 'I cannot process this request. It appears to attempt overriding safety guidelines or accessing protected information. Please rephrase your question.';
