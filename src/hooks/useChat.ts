import { useState, useCallback } from "react";
import { Message } from "@/components/ChatMessage";
import { Conversation } from "@/components/Sidebar";

// Simulated AI responses
const aiResponses = [
  "That's a great question! Let me think about it...\n\nBased on my understanding, I would say that the key factors to consider are:\n\n1. **Context matters** - The specific situation you're in will greatly influence the best approach.\n\n2. **Start small** - It's often better to begin with manageable steps and build from there.\n\n3. **Iterate and improve** - Don't expect perfection on the first try. Learning from each attempt is valuable.\n\nWould you like me to elaborate on any of these points?",
  "I'd be happy to help you with that! Here's what I think:\n\nThe approach you're considering is definitely viable. There are several ways to accomplish this, and I'll outline the most effective method.\n\nFirst, you'll want to consider your goals and constraints. Once those are clear, the path forward becomes much clearer.\n\nIs there a specific aspect you'd like me to focus on?",
  "That's an interesting perspective! Let me share my thoughts:\n\n**Key insights:**\n- Innovation often comes from unexpected places\n- Collaboration tends to produce better results than solo efforts\n- Persistence is usually more important than initial talent\n\nThe research in this area suggests that a balanced approach works best. Would you like me to provide more specific recommendations?",
];

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

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

      // Simulate AI response
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500));

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    },
    [activeConversationId, createNewConversation]
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
