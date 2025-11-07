import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useChat } from '@contexts/ChatContext';
import { useApp } from '@contexts/AppContext';
import { MessageList } from '@components/MessageList';
import { MessageInput } from '@components/MessageInput';
import { ModeSelector } from '@components/ModeSelector';
import { Sidebar } from '@components/Sidebar';
import { AppMode, Message, ChatSession } from '@types/index';
import { sendChatMessage } from '@services/chatService';
import '../styles/Chat.css';

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { authState, signOut } = useAuth();
  const { messages, addMessage, createNewSession, setSession, currentSession } = useChat();
  const { appState, setCurrentMode, addSession, updateSession, deleteSession } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authState.isAuthenticated) {
      navigate('/signin');
    }
  }, [authState.isAuthenticated, navigate]);

  useEffect(() => {
    // Initialize a new session if none exists
    if (!currentSession && authState.user) {
      const newSession = createNewSession(appState.currentMode, authState.user.id);
      addSession(newSession);
    }
  }, [currentSession, authState.user, appState.currentMode]);

  const handleSendMessage = async (content: string) => {
    if (!authState.user || !currentSession) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      mode: appState.currentMode,
    };

    addMessage(userMessage);
    setIsLoading(true);

    try {
      // Call the chat service based on the current mode
      const response = await sendChatMessage({
        messages: [...messages, userMessage],
        mode: appState.currentMode,
        sessionId: currentSession.id,
      });

      const assistantMessage: Message = {
        ...response.message,
        id: `msg_${Date.now()}_assistant`,
        timestamp: new Date(),
      };

      addMessage(assistantMessage);

      // Update session title if it's the first user message
      if (messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        updateSession(currentSession.id, { title });
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message || 'Unknown error'}`,
        timestamp: new Date(),
        mode: appState.currentMode,
        metadata: {
          isError: true,
        },
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (mode: AppMode) => {
    setCurrentMode(mode);

    // Create a new session when mode changes
    if (authState.user) {
      const newSession = createNewSession(mode, authState.user.id);
      addSession(newSession);
    }
  };

  const handleNewChat = () => {
    if (authState.user) {
      const newSession = createNewSession(appState.currentMode, authState.user.id);
      addSession(newSession);
    }
  };

  const handleSessionSelect = (session: ChatSession) => {
    setSession(session);
    setCurrentMode(session.mode);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
  };

  const getPlaceholderText = (): string => {
    switch (appState.currentMode) {
      case AppMode.BUDDY:
        return 'Ask me anything...';
      case AppMode.AI_TOOL_ASSISTANT:
        return 'What task do you need help with?';
      case AppMode.DEEP_RESEARCH:
        return 'What would you like me to research?';
      default:
        return 'Type your message...';
    }
  };

  return (
    <div className="chat-layout">
      {isSidebarOpen && (
        <Sidebar
          sessions={appState.sessions}
          currentSessionId={currentSession?.id || null}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          userName={authState.user?.name || authState.user?.email}
          onSignOut={handleSignOut}
        />
      )}

      <div className="chat-main">
        <div className="chat-header">
          <button
            className="toggle-sidebar-button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <ModeSelector
            currentMode={appState.currentMode}
            onModeChange={handleModeChange}
          />
        </div>

        <div className="chat-messages">
          <MessageList messages={messages} isLoading={isLoading} />
        </div>

        <div className="chat-input">
          <MessageInput
            onSendMessage={handleSendMessage}
            isDisabled={isLoading}
            placeholder={getPlaceholderText()}
          />
        </div>
      </div>
    </div>
  );
};
