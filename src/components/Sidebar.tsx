import React from 'react';
import { ChatSession, AppMode } from '@types';
import { Logo } from './Logo';
import '../styles/Chat.css';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession?: (sessionId: string) => void;
  userName?: string;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  userName,
  onSignOut,
}) => {
  const getModeIcon = (mode: AppMode): string => {
    switch (mode) {
      case AppMode.BUDDY:
        return '💬';
      case AppMode.AI_TOOL_ASSISTANT:
        return '🔧';
      case AppMode.DEEP_RESEARCH:
        return '🔍';
      default:
        return '💬';
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Logo variant="full" size="medium" />
        <button onClick={onNewChat} className="new-chat-button">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Chat
        </button>
      </div>

      <div className="sidebar-content">
        <div className="session-list">
          {sessions.length === 0 ? (
            <div className="empty-sessions">
              <p>No chat history yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${
                  currentSessionId === session.id ? 'active' : ''
                }`}
                onClick={() => onSessionSelect(session)}
              >
                <div className="session-icon">{getModeIcon(session.mode)}</div>
                <div className="session-info">
                  <div className="session-title">{session.title}</div>
                  <div className="session-meta">
                    {session.messages.length} messages •{' '}
                    {formatDate(session.updatedAt)}
                  </div>
                </div>
                {onDeleteSession && (
                  <button
                    className="delete-session-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this conversation?')) {
                        onDeleteSession(session.id);
                      }
                    }}
                    aria-label="Delete session"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{userName || 'User'}</div>
          </div>
        </div>
        <button onClick={onSignOut} className="sign-out-button" title="Sign Out">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};
