import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { chatHistoryService, ChatMessage } from "@/services/chatHistoryService";
import { API_ENDPOINTS } from "@/constants/api";
import { useAppContext } from "@/contexts/AppContext";

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  clearHistory: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => chatHistoryService.getMessages());
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const { workspaceId } = useAppContext();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (messages.length > 0) {
      chatHistoryService.saveMessages(messages);
    }
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || isLoading || !workspaceId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    startTimeRef.current = performance.now();

    fetch(API_ENDPOINTS.RAG_QUERY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        query: userMessage.content,
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to get response from assistant");
        const data = await response.json();
        const responseTime = parseFloat(((performance.now() - startTimeRef.current) / 1000).toFixed(2));

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response || "I couldn't generate a response.",
          timestamp: new Date(),
          usedEmbeddings: data.used_embeddings || false,
          responseTime,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      })
      .catch((error) => {
        console.error("Error calling RAG API:", error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [input, isLoading, workspaceId]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setInput("");
    setIsLoading(false);
    chatHistoryService.clearHistory();
  }, []);

  return (
    <ChatContext.Provider value={{ messages, isLoading, input, setInput, sendMessage, clearHistory }}>
      {children}
    </ChatContext.Provider>
  );
};
