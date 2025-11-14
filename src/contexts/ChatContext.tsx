import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Message, ChatSession, AppMode } from '@types';

interface ChatContextType {
  currentSession: ChatSession | null;
  messages: Message[];
  isStreaming: boolean;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  clearMessages: () => void;
  setSession: (session: ChatSession) => void;
  createNewSession: (mode: AppMode, userId: string) => ChatSession;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming] = useState(false);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);

    if (currentSession) {
      const updatedSession: ChatSession = {
        ...currentSession,
        messages: [...currentSession.messages, message],
        updatedAt: new Date(),
      };
      setCurrentSession(updatedSession);
    }
  };

  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
    );

    if (currentSession) {
      const updatedSession: ChatSession = {
        ...currentSession,
        messages: currentSession.messages.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
        updatedAt: new Date(),
      };
      setCurrentSession(updatedSession);
    }
  };

  const deleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

    if (currentSession) {
      const updatedSession: ChatSession = {
        ...currentSession,
        messages: currentSession.messages.filter((msg) => msg.id !== messageId),
        updatedAt: new Date(),
      };
      setCurrentSession(updatedSession);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const setSession = (session: ChatSession) => {
    setCurrentSession(session);
    setMessages(session.messages);
  };

  const createNewSession = (mode: AppMode, userId: string): ChatSession => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      userId,
      mode,
      title: getDefaultTitle(mode),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentSession(newSession);
    setMessages([]);
    return newSession;
  };

  const getDefaultTitle = (mode: AppMode): string => {
    switch (mode) {
      case AppMode.BUDDY:
        return 'New Chat';
      case AppMode.AI_TOOL_ASSISTANT:
        return 'Find AI Tools';
      case AppMode.DEEP_RESEARCH:
        return 'Research Session';
      default:
        return 'New Session';
    }
  };

  const value: ChatContextType = {
    currentSession,
    messages,
    isStreaming,
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
    setSession,
    createNewSession,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
