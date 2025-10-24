import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Loader2, Bot, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import brainLogo from "@/assets/brain-logo.png";
import { cn } from "@/lib/utils";
import { API_ENDPOINTS } from "@/constants/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  usedEmbeddings?: boolean;
}

interface ChatAssistantProps {
  brandName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string | null;
  primaryFont?: string;
  secondaryFont?: string;
}

export default function ChatAssistant({
  brandName = "Knowledge Assistant",
  primaryColor = "#6366f1",
  secondaryColor = "#c026d3",
  logo = null,
  primaryFont = "Inter",
  secondaryFont = "Georgia",
}: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.RAG_QUERY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspace_id: "37926ce6-9757-4667-bf16-b438d6bc95b1",
          query: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from assistant");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I couldn't generate a response.",
        timestamp: new Date(),
        usedEmbeddings: data.used_embeddings || false,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling RAG API:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Chat Header */}
      <Card className="mb-4 p-4 border-b">
        <div className="flex items-center gap-3">
          <img src={logo || brainLogo} alt={brandName} className="h-10 w-10 object-contain rounded" />
          <div>
            <h2 className="text-lg font-semibold" style={{ fontFamily: primaryFont }}>
              {brandName}
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: secondaryFont }}>
              Ask me anything about your knowledge base
            </p>
          </div>
        </div>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <img
                src={logo || brainLogo}
                alt={brandName}
                className="h-16 w-16 object-contain rounded-2xl animate-pulse"
              />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold" style={{ fontFamily: primaryFont }}>
                  Start a conversation
                </h3>
                <p className="text-muted-foreground max-w-md" style={{ fontFamily: secondaryFont }}>
                  Ask questions about your documents, files, and knowledge base. I'm here to help!
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full mt-6">
                {[
                  "What files do I have uploaded?",
                  "Summarize my documents",
                  "Help me find information",
                  "What can you help me with?",
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(suggestion)}
                    className="p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-all text-sm text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-fade-in",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.role === "assistant" && (
                    <img
                      src={logo || brainLogo}
                      alt={brandName}
                      className="h-8 w-8 object-contain rounded-lg flex-shrink-0 mt-1"
                    />
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
                      message.role === "user" ? "text-white" : "bg-muted border",
                    )}
                    style={message.role === "user" ? { backgroundColor: primaryColor } : undefined}
                  >
                    <p
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                      style={{ fontFamily: message.role === "user" ? primaryFont : secondaryFont }}
                    >
                      {message.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className={cn("text-xs", message.role === "user" ? "text-white/70" : "text-muted-foreground")}>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {message.role === "assistant" && message.usedEmbeddings !== undefined && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4"
                          style={{
                            borderColor: message.usedEmbeddings ? `${primaryColor}40` : `${secondaryColor}40`,
                            backgroundColor: message.usedEmbeddings ? `${primaryColor}10` : `${secondaryColor}10`,
                            color: message.usedEmbeddings ? primaryColor : secondaryColor,
                          }}
                        >
                          {message.usedEmbeddings ? "Context Used" : "No Context"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div
                      className="h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0 mt-1 border"
                      style={{
                        backgroundImage: `linear-gradient(to bottom right, ${primaryColor}20, ${primaryColor}40)`,
                        borderColor: `${primaryColor}40`,
                      }}
                    >
                      <UserCircle className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 animate-fade-in">
                  <img
                    src={logo || brainLogo}
                    alt={brandName}
                    className="h-8 w-8 object-contain rounded-lg flex-shrink-0 animate-pulse"
                    style={{
                      animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, shimmer 2s linear infinite",
                      backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                      backgroundSize: "200% 100%",
                    }}
                  />
                  <div className="bg-muted border rounded-2xl px-3 py-2 shadow-sm">
                    <span
                      className="text-xs text-muted-foreground flex items-center"
                      style={{ fontFamily: secondaryFont }}
                    >
                      Thinking
                      <span className="inline-flex ml-0.5">
                        <span className="animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1.4s" }}>
                          .
                        </span>
                        <span className="animate-bounce" style={{ animationDelay: "200ms", animationDuration: "1.4s" }}>
                          .
                        </span>
                        <span className="animate-bounce" style={{ animationDelay: "400ms", animationDuration: "1.4s" }}>
                          .
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Chat Input */}
        <div className="border-t p-4 bg-background">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="resize-none min-h-[44px] pr-4"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[44px] w-[44px] flex-shrink-0"
              style={input.trim() && !isLoading ? { backgroundColor: primaryColor } : undefined}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Messages are not preserved. Refresh will clear the conversation.
          </p>
        </div>
      </Card>
    </div>
  );
}
