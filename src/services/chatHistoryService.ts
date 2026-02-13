const CHAT_HISTORY_KEY = "CHAT_HISTORY";

interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  usedEmbeddings?: boolean;
  responseTime?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  usedEmbeddings?: boolean;
  responseTime?: number;
}

export const chatHistoryService = {
  getMessages(): ChatMessage[] {
    try {
      const raw = sessionStorage.getItem(CHAT_HISTORY_KEY);
      if (!raw) return [];
      const stored: StoredMessage[] = JSON.parse(raw);
      return stored.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {
      return [];
    }
  },

  saveMessages(messages: ChatMessage[]): void {
    try {
      sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch {
      // storage full or unavailable
    }
  },

  clearHistory(): void {
    sessionStorage.removeItem(CHAT_HISTORY_KEY);
  },
};
