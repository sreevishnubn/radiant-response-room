import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "@/components/Sidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { EmptyState } from "@/components/EmptyState";
import { TypingIndicator } from "@/components/TypingIndicator";
import { useChat } from "@/hooks/useChat";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    messages,
    activeConversationId,
    isLoading,
    sendMessage,
    createNewConversation,
    selectConversation,
    deleteConversation,
    stopGeneration,
  } = useChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Close sidebar on mobile after selecting conversation
  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background dark">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={handleSelectConversation}
        onNew={createNewConversation}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main chat area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Messages area */}
        <ScrollArea
          ref={scrollRef}
          className="flex-1 scrollbar-thin"
        >
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={sendMessage} />
          ) : (
            <div className="pb-32">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border bg-background/80 backdrop-blur-lg">
          <div className="mx-auto w-full max-w-3xl px-4 py-4">
            <ChatInput
              onSend={sendMessage}
              onStop={stopGeneration}
              isLoading={isLoading}
            />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
