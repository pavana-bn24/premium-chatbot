import { useState, useRef, useCallback, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { Avatar } from './Avatar';
import type { ChatMessage } from '../types/chat';
import type { AiStatus } from '../hooks/useChat';
import {
  MessageCircle, Code2, BarChart3, Lightbulb, FileText,
  RefreshCw, Trash2, Download, ShieldAlert,
} from 'lucide-react';
import { validatePrompt, BLOCK_MESSAGE } from '../services/safety';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isGenerating: boolean;
  onRegenerate: () => void;
  onClearConversation: () => void;
  aiStatus: AiStatus;
}

const quickActions = [
  {
    icon: Code2, label: 'Write Code', desc: 'Build scripts & programs',
    prompt: 'Write a Python script to analyze a CSV file and generate a summary report with charts.',
  },
  {
    icon: BarChart3, label: 'Analyze Data', desc: 'Process & visualize',
    prompt: 'What are the best practices for exploratory data analysis? Walk me through the key steps.',
  },
  {
    icon: Lightbulb, label: 'Brainstorm Ideas', desc: 'Generate creative concepts',
    prompt: 'Help me brainstorm innovative startup ideas in the AI and sustainability space.',
  },
  {
    icon: FileText, label: 'Explain Concepts', desc: 'Break down complex topics',
    prompt: 'Explain how large language models like GPT work, in simple terms with analogies.',
  },
];

function exportAsTxt(messages: ChatMessage[]) {
  if (!messages.length) return;
  const lines: string[] = [];
  lines.push('═══ Nexa AI Chat Export ═══');
  lines.push(`Exported: ${new Date().toLocaleString()}`);
  lines.push('');
  for (const msg of messages) {
    const role = msg.sender === 'user' ? 'You' : 'Nexa AI';
    const time = new Date(msg.timestamp).toLocaleString();
    lines.push(`[${role}] ${time}`);
    lines.push(msg.content);
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nexa-chat-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_LABELS: Record<AiStatus, { label: string; dotClass: string }> = {
  ready: { label: 'AI Ready', dotClass: 'status-dot status-ready' },
  busy: { label: 'AI Busy', dotClass: 'status-dot status-busy' },
  unavailable: { label: 'Service Unavailable', dotClass: 'status-dot status-unavailable' },
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages, onSendMessage, isGenerating, onRegenerate, onClearConversation, aiStatus,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isGenerating]);

  useEffect(() => {
    if (safetyWarning) {
      const t = setTimeout(() => setSafetyWarning(null), 6000);
      return () => clearTimeout(t);
    }
  }, [safetyWarning]);

  const handleQuickAction = useCallback((prompt: string) => {
    setInputValue(prompt);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isGenerating) return;

    const result = validatePrompt(text);
    if (!result.safe) {
      setSafetyWarning(result.reason ?? 'Blocked');
      onSendMessage(BLOCK_MESSAGE);
      setInputValue('');
      return;
    }

    onSendMessage(text);
    setInputValue('');
  }, [inputValue, isGenerating, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const hasMessages = messages.length > 0;
  const status = STATUS_LABELS[aiStatus];

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <div className="bg-glow" />

      <header className="header">
        <div className="header-left">
          <div className="status-indicator">
            <span className={status.dotClass} />
            <span className="status-label">{status.label}</span>
          </div>
          <span className="header-divider" />
          <span className="header-provider">Powered by Gemini 2.5 Flash</span>
        </div>
      </header>

      <div className="chat-area">
        <div className="chat-inner">
          {!hasMessages ? (
            <div className="hero hero-enter">
              <div className="hero-icon">
                <MessageCircle size={22} />
              </div>
              <h1>Welcome to Nexa AI</h1>
              <p>Your intelligent workspace for learning, coding, research, and productivity.</p>
              <div className="quick-actions">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    className="quick-card"
                    onClick={() => handleQuickAction(action.prompt)}
                  >
                    <div className="quick-card-icon">
                      <action.icon size={15} />
                    </div>
                    <div>
                      <div className="quick-card-label">{action.label}</div>
                      <div className="quick-card-desc">{action.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-messages-list">
              {messages.map((msg, idx) => (
                <div key={msg.id} className="msg-enter">
                  <MessageBubble
                    message={msg}
                    showRetry={idx === messages.length - 1 && msg.sender === 'ai' && msg.id.endsWith('-err')}
                    onRetry={onRegenerate}
                  />
                </div>
              ))}
              {isGenerating && (
                <div className="message-row is-typing">
                  <Avatar sender="ai" />
                  <div className="message-body">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={endRef} />

              <div className="chat-actions">
                <button
                  className="chat-action-btn"
                  onClick={onRegenerate}
                  disabled={isGenerating || !hasMessages}
                >
                  <RefreshCw size={13} />
                  Regenerate
                </button>
                <button
                  className="chat-action-btn"
                  onClick={() => exportAsTxt(messages)}
                  disabled={!hasMessages}
                >
                  <Download size={13} />
                  Export
                </button>
                <button
                  className="chat-action-btn danger"
                  onClick={onClearConversation}
                  disabled={isGenerating || !hasMessages}
                >
                  <Trash2 size={13} />
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="input-area">
        <div className="input-wrap">
          {safetyWarning && (
            <div className="safety-warning">
              <ShieldAlert size={14} />
              <span>Blocked: {safetyWarning}</span>
            </div>
          )}
          <ChatInput
            ref={inputRef}
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            onKeyDown={handleKeyDown}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
};
