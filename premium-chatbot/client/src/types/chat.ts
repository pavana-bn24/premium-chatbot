export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface ChatConversation {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: Date;
}
