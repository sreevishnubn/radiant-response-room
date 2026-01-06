import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { EmptyState } from "@/components/EmptyState";
import { TypingIndicator } from "@/components/TypingIndicator";
import { PreferencesPanel } from "@/components/PreferencesPanel";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Settings, LogIn, LogOut } from "lucide-react";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { user, loading: authLoading, signOut } = useAuth();

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
        {/* Header with auth */}
        <header className="flex items-center justify-end gap-2 border-b border-border px-4 py-2">
          {authLoading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPrefsOpen(true)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Preferences
              </Button>
              <Button variant="ghost" size="sm" asChild className="gap-2">
                <Link to="/agent">Agent</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
        </header>

        {/* Messages area */}
        <ScrollArea
          ref={scrollRef}
          className="flex-1 scrollbar-thin"
        >
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={(msg) => sendMessage(msg, "chat")} />
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

      {/* Preferences Panel */}
      {user && (
        <PreferencesPanel
          userId={user.id}
          isOpen={prefsOpen}
          onClose={() => setPrefsOpen(false)}
        />
      )}
    </div>
  );
};

export default Index;
