import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  AuthState,
  AuthContextType,
  SignInCredentials,
  SignUpCredentials,
  AuthUser,
} from '../types/auth';
import { AuthErrorCode } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      // TODO: Replace with actual Amplify Auth check
      const savedUser = localStorage.getItem('broobot_user');
      if (savedUser) {
        const user: AuthUser = JSON.parse(savedUser);
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user,
          error: null,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
        });
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: 'Failed to check authentication status',
      });
    }
  };

  const signIn = async (credentials: SignInCredentials): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      // TODO: Replace with actual Amplify Auth signIn
      // Simulated authentication for development
      if (credentials.email && credentials.password) {
        const mockUser: AuthUser = {
          id: '1',
          email: credentials.email,
          name: credentials.email.split('@')[0],
          emailVerified: true,
          provider: 'email',
        };

        localStorage.setItem('broobot_user', JSON.stringify(mockUser));

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: mockUser,
          error: null,
        });
      } else {
        throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
      }
    } catch (error: any) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Sign in failed',
      }));
      throw error;
    }
  };

  const signUp = async (credentials: SignUpCredentials): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      // TODO: Replace with actual Amplify Auth signUp
      // Simulated sign up for development
      if (credentials.email && credentials.password) {
        const mockUser: AuthUser = {
          id: Date.now().toString(),
          email: credentials.email,
          name: credentials.name || credentials.email.split('@')[0],
          emailVerified: false,
          provider: 'email',
        };

        localStorage.setItem('broobot_user', JSON.stringify(mockUser));

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: mockUser,
          error: null,
        });
      } else {
        throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
      }
    } catch (error: any) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Sign up failed',
      }));
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // TODO: Replace with actual Amplify Auth signOut
      localStorage.removeItem('broobot_user');
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    } catch (error: any) {
      setAuthState((prev) => ({
        ...prev,
        error: error.message || 'Sign out failed',
      }));
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      // TODO: Implement Amplify Google OAuth
      console.log('Google Sign In - To be implemented with Amplify');
      throw new Error('Google Sign In not yet implemented');
    } catch (error: any) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Google sign in failed',
      }));
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      // TODO: Implement Amplify password reset
      console.log('Password reset for:', email);
    } catch (error: any) {
      throw error;
    }
  };

  const confirmSignUp = async (email: string, code: string): Promise<void> => {
    try {
      // TODO: Implement Amplify email confirmation
      console.log('Confirming sign up for:', email, 'with code:', code);
    } catch (error: any) {
      throw error;
    }
  };

  const value: AuthContextType = {
    authState,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    confirmSignUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
