import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppMode, AppState, ChatSession } from '@types';

interface AppContextType {
  appState: AppState;
  setCurrentMode: (mode: AppMode) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  addSession: (session: ChatSession) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  deleteSession: (sessionId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>({
    currentMode: AppMode.BUDDY,
    isAuthenticated: false,
    user: null,
    currentSession: null,
    sessions: [],
    isLoading: false,
    error: null,
  });

  const setCurrentMode = (mode: AppMode) => {
    setAppState((prev) => ({
      ...prev,
      currentMode: mode,
    }));
  };

  const setCurrentSession = (session: ChatSession | null) => {
    setAppState((prev) => ({
      ...prev,
      currentSession: session,
    }));
  };

  const addSession = (session: ChatSession) => {
    setAppState((prev) => ({
      ...prev,
      sessions: [session, ...prev.sessions],
      currentSession: session,
    }));
  };

  const updateSession = (sessionId: string, updates: Partial<ChatSession>) => {
    setAppState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === sessionId ? { ...session, ...updates } : session
      ),
      currentSession:
        prev.currentSession?.id === sessionId
          ? { ...prev.currentSession, ...updates }
          : prev.currentSession,
    }));
  };

  const deleteSession = (sessionId: string) => {
    setAppState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((session) => session.id !== sessionId),
      currentSession:
        prev.currentSession?.id === sessionId ? null : prev.currentSession,
    }));
  };

  const setLoading = (isLoading: boolean) => {
    setAppState((prev) => ({
      ...prev,
      isLoading,
    }));
  };

  const setError = (error: string | null) => {
    setAppState((prev) => ({
      ...prev,
      error,
    }));
  };

  const clearError = () => {
    setAppState((prev) => ({
      ...prev,
      error: null,
    }));
  };

  const value: AppContextType = {
    appState,
    setCurrentMode,
    setCurrentSession,
    addSession,
    updateSession,
    deleteSession,
    setLoading,
    setError,
    clearError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
