import { useState, useCallback, useRef } from "react";
import { Message } from "@/components/ChatMessage";
import { Conversation } from "@/components/Sidebar";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: "New Chat",
      createdAt: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setMessages([]);
    return newConv.id;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      let convId = activeConversationId;

      // Create new conversation if none exists
      if (!convId) {
        convId = createNewConversation();
        // Update title based on first message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, title: content.slice(0, 30) + (content.length > 30 ? "..." : "") }
              : c
          )
        );
      }

      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Prepare messages for API
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setIsLoading(true);
      abortControllerRef.current = new AbortController();

      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      try {
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: apiMessages }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg?.id === assistantId) {
                    return prev.map((m) =>
                      m.id === assistantId ? { ...m, content: assistantContent } : m
                    );
                  }
                  return [
                    ...prev,
                    {
                      id: assistantId,
                      role: "assistant" as const,
                      content: assistantContent,
                      timestamp: new Date(),
                    },
                  ];
                });
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          console.log("Request aborted");
        } else {
          console.error("Chat error:", error);
          toast.error((error as Error).message || "Failed to send message");
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [activeConversationId, createNewConversation, messages]
  );

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    // In a real app, you'd load messages for this conversation
    setMessages([]);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(undefined);
        setMessages([]);
      }
    },
    [activeConversationId]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, []);

  return {
    conversations,
    messages,
    activeConversationId,
    isLoading,
    sendMessage,
    createNewConversation,
    selectConversation,
    deleteConversation,
    stopGeneration,
  };
};
