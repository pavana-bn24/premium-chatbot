import { useState, useMemo } from 'react';
import {
  Plus, MessageSquare, Trash2, Search, Edit,
  MessageCircle, Sparkles, ShieldCheck,
} from 'lucide-react';
import type { ChatConversation } from '../types/chat';
import { safetyFeatures } from '../services/safety';

interface SidebarProps {
  conversations: ChatConversation[];
  currentConversationId?: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onRenameChat: (id: string, newName: string) => void;
  onDeleteChat: (id: string) => void;
}

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return date.toLocaleDateString();
}

function previewText(messages: ChatConversation['messages']): string {
  if (messages.length === 0) return 'No messages';
  const last = messages[messages.length - 1];
  const text = last.content.replace(/```[\s\S]*?```/g, '`code`').replace(/[*_#`>\[\]]/g, '').trim();
  return text.length > 60 ? text.slice(0, 60) + '…' : text;
}

function lastTime(messages: ChatConversation['messages'], created: Date): string {
  if (messages.length === 0) return relativeTime(created);
  return relativeTime(messages[messages.length - 1].timestamp);
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations, currentConversationId,
  onNewChat, onSelectChat, onRenameChat, onDeleteChat,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSafety, setShowSafety] = useState(false);

  const filtered = useMemo(() =>
    conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [conversations, searchQuery]
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-wrap">
          <div className="logo-mark">
            <MessageCircle size={16} />
          </div>
          <div className="logo-text-wrap">
            <span className="logo-text-main">Nexa AI</span>
            <span className="logo-text-sub">Intelligent Workspace</span>
          </div>
        </div>
        <button onClick={onNewChat} className="btn-new">
          <Plus size={15} />
          New Chat
        </button>
      </div>

      <div className="sidebar-search">
        <div className="search-wrap">
          <Search size={13} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
          />
        </div>
      </div>

      <nav className="sidebar-list">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <MessageSquare size={22} color="#555568" className="mb-3" />
            <span className="text-sm text-[#555568]">
              {searchQuery ? 'No results found' : 'No conversations yet'}
            </span>
          </div>
        ) : (
          filtered.map((chat) => {
            const isActive = chat.id === currentConversationId;
            return (
              <div
                key={chat.id}
                className={`conv-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <MessageSquare size={15} className="conv-item-icon" />
                <div className="conv-item-body">
                  {renamingId === chat.id ? (
                    <input
                      type="text"
                      value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      onBlur={() => {
                        if (renameVal.trim()) onRenameChat(chat.id, renameVal.trim());
                        setRenamingId(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (renameVal.trim()) onRenameChat(chat.id, renameVal.trim());
                          setRenamingId(null);
                        }
                      }}
                      className="rename-input"
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="conv-item-top">
                        <span className="conv-item-name">{chat.name}</span>
                        <span className="conv-item-time">{lastTime(chat.messages, chat.createdAt)}</span>
                      </div>
                      <div className="conv-item-preview">{previewText(chat.messages)}</div>
                    </>
                  )}
                </div>
                <div className="conv-item-actions">
                  <button
                    onClick={e => { e.stopPropagation(); setRenamingId(chat.id); setRenameVal(chat.name); }}
                    className="conv-item-action"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteChat(chat.id); }}
                    className="conv-item-action danger"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="profile-wrap">
          <div className="profile-avatar">
            <Sparkles size={13} />
          </div>
          <div className="profile-info">
            <div className="profile-name">Guest</div>
            <div className="profile-tier">Free Plan</div>
          </div>
        </div>
        <div className="sidebar-safety">
          <button
            className="safety-badge"
            onClick={() => setShowSafety(!showSafety)}
          >
            <ShieldCheck size={12} />
            <span>AI Safety</span>
          </button>
          {showSafety && (
            <div className="safety-panel">
              <div className="safety-panel-title">AI Safety Features</div>
              {safetyFeatures.map((f) => (
                <div key={f.id} className="safety-feature">
                  <span className="safety-check">✓</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
