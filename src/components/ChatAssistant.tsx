import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Loader2, Bot, UserCircle } from "lucide-react";
import brainLogo from "@/assets/brain-logo.png";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatAssistantProps {
  brandName?: string;
  primaryColor?: string;
  logo?: string | null;
}

export default function ChatAssistant({
  brandName = "Knowledge Assistant",
  primaryColor = "#6366f1",
  logo = null,
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

    // Simulate API call - will be replaced with actual backend integration
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a placeholder response. Backend integration coming soon!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
      inputRef.current?.focus();
    }, 1500);
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
            <h2 className="font-satoshi text-lg font-semibold">{brandName}</h2>
            <p className="text-sm text-muted-foreground">Ask me anything about your knowledge base</p>
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
                <h3 className="font-satoshi text-xl font-semibold">Start a conversation</h3>
                <p className="text-muted-foreground max-w-md">
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
                    message.role === "user" ? "justify-end" : "justify-start"
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
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border"
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-2",
                        message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 mt-1 border border-primary/20">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 animate-fade-in">
                  <img 
                    src={logo || brainLogo} 
                    alt={brandName} 
                    className="h-8 w-8 object-contain rounded-lg flex-shrink-0" 
                  />
                  <div className="bg-muted border rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: primaryColor }} />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
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
              style={
                input.trim() && !isLoading
                  ? { backgroundColor: primaryColor }
                  : undefined
              }
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
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
