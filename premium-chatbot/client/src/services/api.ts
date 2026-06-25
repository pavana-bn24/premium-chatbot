import type { ChatConversation } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  safety_block: 'Request blocked by AI Safety Protection.',
  rate_limit: 'Too many requests were sent to the AI service. Please wait a few seconds and try again.',
  service_unavailable: 'AI service is temporarily unavailable. Please try again in a few moments.',
  network_error: 'Unable to connect to the AI service. Please check your connection.',
};

export function getUserMessage(errorCode: string, fallback: string): string {
  return ERROR_MESSAGES[errorCode] || fallback;
}

export async function sendMessageToApi(
  conversationId: string,
  messageContent: string,
  allConversations: ChatConversation[]
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const currentConv = allConversations.find(conv => conv.id === conversationId);
  const messagesForContext = currentConv?.messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  })) || [];

  messagesForContext.push({ role: 'user', parts: [{ text: messageContent }] });

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        messages: messagesForContext,
        temperature: 0.7,
        model: 'gemini-2.5-flash',
      }),
    });
  } catch {
    throw new ApiError('network_error', ERROR_MESSAGES.network_error);
  }

  const errorCode = response.headers.get('X-Error-Code');
  if (errorCode) {
    const reader = response.body?.getReader();
    let errorText = '';
    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        errorText += decoder.decode(value, { stream: true });
      }
    }
    throw new ApiError(errorCode, getUserMessage(errorCode, errorText || 'An unexpected issue occurred.'));
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError('unknown', errorData.detail || 'An unexpected issue occurred while processing your request.');
  }

  if (!response.body) {
    throw new ApiError('unknown', 'An unexpected issue occurred while processing your request.');
  }

  return response.body.getReader();
}
