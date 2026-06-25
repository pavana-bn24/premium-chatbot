import { useState, useEffect, useCallback } from 'react';
import type { ChatConversation, ChatMessage } from '../types/chat';
import { sendMessageToApi, ApiError, getUserMessage } from '../services/api';

export type AiStatus = 'ready' | 'busy' | 'unavailable';

export const useChat = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus>('ready');

  const updateStatus = useCallback((generating: boolean, errorCode?: string | null) => {
    if (generating) {
      setAiStatus('busy');
    } else if (errorCode === 'service_unavailable' || errorCode === 'network_error') {
      setAiStatus('unavailable');
    } else {
      setAiStatus('ready');
    }
  }, []);

  useEffect(() => {
    if (initialized) return;
    const stored = localStorage.getItem('chatConversations');
    if (stored) {
      try {
        const parsed: ChatConversation[] = JSON.parse(stored);
        const fixed = parsed.map(c => ({
          ...c,
          createdAt: new Date(c.createdAt),
          messages: c.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
        }));
        setConversations(fixed);
        if (fixed.length > 0) {
          setCurrentConversation(fixed[0]);
        } else {
          createNewChatInternal();
        }
      } catch {
        createNewChatInternal();
      }
    } else {
      createNewChatInternal();
    }
    setInitialized(true);
  }, [initialized]);

  const createNewChatInternal = () => {
    const newChat: ChatConversation = {
      id: Date.now().toString(),
      name: 'New Chat',
      messages: [],
      createdAt: new Date(),
    };
    setConversations([newChat]);
    setCurrentConversation(newChat);
  };

  useEffect(() => {
    if (initialized) {
      localStorage.setItem('chatConversations', JSON.stringify(conversations));
    }
  }, [conversations, initialized]);

  const streamResponse = useCallback(async (
    convId: string,
    userContent: string,
    convs: ChatConversation[],
  ) => {
    setIsGenerating(true);
    setLastError(null);
    setLastErrorCode(null);
    try {
      const reader = await sendMessageToApi(convId, userContent, convs);
      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        content += text;

        setCurrentConversation((prev) => {
          if (!prev) return null;
          const existingIdx = prev.messages.findIndex(
            (msg) => msg.sender === 'ai' && msg.id === 'generating'
          );
          if (existingIdx !== -1) {
            const updated = [...prev.messages];
            updated[existingIdx] = { ...updated[existingIdx], content };
            return { ...prev, messages: updated };
          }
          return {
            ...prev,
            messages: [
              ...prev.messages,
              { id: 'generating', content, sender: 'ai', timestamp: new Date() },
            ],
          };
        });
      }

      const finalId = Date.now().toString();
      setCurrentConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === 'generating' ? { ...msg, id: finalId } : msg
          ),
        };
      });
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === convId
            ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === 'generating' ? { ...msg, id: finalId } : msg
                ),
              }
            : conv
        )
      );
      updateStatus(false, null);
    } catch (error) {
      const errorCode = error instanceof ApiError ? error.code : 'unknown';
      const message = error instanceof ApiError
        ? error.message
        : getUserMessage('unknown', 'An unexpected issue occurred while processing your request.');
      const errorMsg: ChatMessage = {
        id: Date.now().toString() + '-err',
        content: message,
        sender: 'ai',
        timestamp: new Date(),
      };
      setLastError(message);
      setLastErrorCode(errorCode);
      setCurrentConversation((prev) =>
        prev ? { ...prev, messages: [...prev.messages, errorMsg] } : null
      );
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === convId
            ? { ...conv, messages: [...conv.messages, errorMsg] }
            : conv
        )
      );
      updateStatus(false, errorCode);
    } finally {
      setIsGenerating(false);
    }
  }, [updateStatus]);

  const addMessage = useCallback(async (message: ChatMessage) => {
    if (!currentConversation) return;

    const isFirstUserMsg = message.sender === 'user'
      && currentConversation.messages.filter(m => m.sender === 'user').length === 0;

    const updatedConversations = conversations.map((conv) =>
      conv.id === currentConversation.id
        ? { ...conv, messages: [...conv.messages, message] }
        : conv
    );
    setConversations(updatedConversations);
    setCurrentConversation((prev) =>
      prev ? { ...prev, messages: [...prev.messages, message] } : null
    );

    if (isFirstUserMsg) {
      const autoName = message.content.length > 45
        ? message.content.slice(0, 45) + '…'
        : message.content;
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversation.id ? { ...conv, name: autoName } : conv
        )
      );
      setCurrentConversation((prev) =>
        prev ? { ...prev, name: autoName } : null
      );
    }

    if (message.sender === 'user') {
      await streamResponse(currentConversation.id, message.content, updatedConversations);
    }
  }, [conversations, currentConversation, streamResponse]);

  const regenerateLastResponse = useCallback(async () => {
    if (!currentConversation || currentConversation.messages.length === 0) return;
    const msgs = currentConversation.messages;

    let lastUserIdx = -1;
    let lastUserContent = '';
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].sender === 'user') {
        lastUserIdx = i;
        lastUserContent = msgs[i].content;
        break;
      }
    }
    if (lastUserIdx === -1 || !lastUserContent) return;

    const trimmedMessages = msgs.slice(0, lastUserIdx + 1);
    const convId = currentConversation.id;

    const updatedConvs = conversations.map(conv =>
      conv.id === convId ? { ...conv, messages: trimmedMessages } : conv
    );

    setCurrentConversation(prev =>
      prev ? { ...prev, messages: trimmedMessages } : null
    );
    setConversations(updatedConvs);
    setLastError(null);
    setLastErrorCode(null);

    await streamResponse(convId, lastUserContent, updatedConvs);
  }, [conversations, currentConversation, streamResponse]);

  const clearConversation = useCallback(() => {
    if (!currentConversation) return;
    setCurrentConversation(prev => prev ? { ...prev, messages: [] } : null);
    setConversations(prev => prev.map(conv =>
      conv.id === currentConversation.id ? { ...conv, messages: [] } : conv
    ));
  }, [currentConversation]);

  const startNewChat = useCallback(() => {
    const newChat: ChatConversation = {
      id: Date.now().toString(),
      name: 'New Chat',
      messages: [],
      createdAt: new Date(),
    };
    setConversations((prev) => [newChat, ...prev]);
    setCurrentConversation(newChat);
  }, []);

  const selectConversation = useCallback((id: string) => {
    const selected = conversations.find((conv) => conv.id === id);
    if (selected) {
      setCurrentConversation(selected);
    }
  }, [conversations]);

  const renameConversation = useCallback((id: string, newName: string) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, name: newName } : conv))
    );
    setCurrentConversation((prev) =>
      prev?.id === id ? { ...prev, name: newName } : prev
    );
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((conv) => conv.id !== id);
      if (currentConversation?.id === id) {
        const next = filtered.length > 0 ? filtered[0] : null;
        setCurrentConversation(next);
        if (!next) {
          const newChat: ChatConversation = {
            id: Date.now().toString(),
            name: 'New Chat',
            messages: [],
            createdAt: new Date(),
          };
          setConversations([newChat]);
          setCurrentConversation(newChat);
          return [newChat];
        }
      }
      return filtered;
    });
  }, [currentConversation]);

  return {
    conversations,
    currentConversation,
    addMessage,
    startNewChat,
    selectConversation,
    renameConversation,
    deleteConversation,
    regenerateLastResponse,
    clearConversation,
    isGenerating,
    aiStatus,
    lastError,
    lastErrorCode,
  };
};
