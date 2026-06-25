import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types/chat';
import { Avatar } from './Avatar';

interface Props {
  message: ChatMessage;
  showRetry?: boolean;
  onRetry?: () => void;
}

export const MessageBubble: React.FC<Props> = ({ message, showRetry, onRetry }) => {
  const isUser = message.sender === 'user';
  const isError = !isUser && message.id.endsWith('-err');

  return (
    <div className={`message-row ${isUser ? 'user' : ''}`}>
      <Avatar sender={message.sender} />
      <div className="message-body">
        <div className={`message-bubble ${isUser ? 'user' : 'ai'} ${isError ? 'bubble-error' : ''}`}>
          <div className="markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
                  ) : (
                    <code {...props}>{children}</code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        {!isUser && (
          <div className="copy-row">
            <CopyButton content={message.content} />
            {showRetry && onRetry && (
              <button onClick={onRetry} className="copy-btn">
                <RefreshCw size={11} />
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="copy-btn">
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-lang">{language}</span>
        <div className="code-actions">
          <button onClick={() => setExpanded(!expanded)} className="code-btn">
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="code-btn"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="overflow-x-auto">
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: 0,
              background: '#0d0d14',
              fontSize: '13px',
              lineHeight: '1.6',
            }}
            showLineNumbers
          >
            {code}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}
