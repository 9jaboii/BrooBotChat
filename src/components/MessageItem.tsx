import React from 'react';
import { Message } from '@types';
import ReactMarkdown from 'react-markdown';
import '../styles/Chat.css';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`message-item ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="message-avatar">
        {isUser ? (
          <div className="avatar user-avatar">U</div>
        ) : (
          <div className="avatar bot-avatar">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
        )}
      </div>

      <div className="message-content">
        <div className="message-header">
          <span className="message-role">{isUser ? 'You' : 'BrooBot'}</span>
          <span className="message-time">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div className="message-body">
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>

        {message.metadata?.isStreaming && (
          <div className="streaming-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}

        {message.metadata?.isError && (
          <div className="error-badge">
            <span>⚠️ Error</span>
          </div>
        )}

        {message.metadata?.toolRecommendations &&
          message.metadata.toolRecommendations.length > 0 && (
            <div className="tool-recommendations">
              <h4>Recommended Tools:</h4>
              <div className="tool-grid">
                {message.metadata.toolRecommendations.map((tool) => (
                  <div key={tool.id} className="tool-card">
                    <div className="tool-header">
                      <h5>{tool.name}</h5>
                      {tool.isFree && <span className="free-badge">Free</span>}
                    </div>
                    <p className="tool-description">{tool.description}</p>
                    <div className="tool-tags">
                      {tool.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tool-link"
                    >
                      Visit Tool →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        {message.metadata?.sources && message.metadata.sources.length > 0 && (
          <div className="research-sources">
            <h4>Sources:</h4>
            <ul className="source-list">
              {message.metadata.sources.map((source) => (
                <li key={source.id} className="source-item">
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.title}
                  </a>
                  <p className="source-excerpt">{source.excerpt}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {message.metadata?.attachments && message.metadata.attachments.length > 0 && (
          <div className="attachments">
            <h4>Attachments:</h4>
            <div className="attachment-grid">
              {message.metadata.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  className="attachment-card"
                  download={attachment.name}
                >
                  <div className="attachment-icon">
                    {getAttachmentIcon(attachment.type)}
                  </div>
                  <div className="attachment-info">
                    <span className="attachment-name">{attachment.name}</span>
                    <span className="attachment-size">
                      {formatFileSize(attachment.size)}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getAttachmentIcon = (type: string): string => {
  const icons: Record<string, string> = {
    pdf: '📄',
    pptx: '📊',
    docx: '📝',
    image: '🖼️',
    code: '💻',
    text: '📃',
  };
  return icons[type] || '📎';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
