import { AuroraBackground } from './components/AuroraBackground';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { useChat } from './hooks/useChat';

function App() {
  const {
    conversations, currentConversation, addMessage,
    startNewChat, selectConversation, renameConversation,
    deleteConversation, regenerateLastResponse, clearConversation,
    isGenerating, aiStatus,
  } = useChat();

  const handleSend = async (text: string) => {
    if (!currentConversation) {
      startNewChat();
      await new Promise(r => requestAnimationFrame(r));
    }
    addMessage({ id: Date.now().toString(), content: text, sender: 'user', timestamp: new Date() });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f] text-[#e8e8ee]">
      <AuroraBackground />
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        onNewChat={startNewChat}
        onSelectChat={selectConversation}
        onRenameChat={renameConversation}
        onDeleteChat={deleteConversation}
      />
      <ChatWindow
        messages={currentConversation?.messages || []}
        onSendMessage={handleSend}
        isGenerating={isGenerating}
        onRegenerate={regenerateLastResponse}
        onClearConversation={clearConversation}
        aiStatus={aiStatus}
      />
    </div>
  );
}

export default App;
