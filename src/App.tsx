import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { AppProvider } from '@contexts/AppContext';
import { ChatProvider } from '@contexts/ChatContext';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { ProtectedRoute } from '@components/ProtectedRoute';
import { SignIn } from '@pages/SignIn';
import { SignUp } from '@pages/SignUp';
import { Chat } from '@pages/Chat';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppProvider>
            <ChatProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Protected Routes */}
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />

                {/* Default Route */}
                <Route path="/" element={<Navigate to="/chat" replace />} />

                {/* 404 Route */}
                <Route path="*" element={<Navigate to="/chat" replace />} />
              </Routes>
            </ChatProvider>
          </AppProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
