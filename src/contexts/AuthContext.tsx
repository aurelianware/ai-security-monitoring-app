import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  provider: 'github' | 'google';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (provider: 'github' | 'google') => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for token in URL first (from OAuth callback)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        
        if (urlToken) {
          // Parse token from URL
          try {
            const userData = JSON.parse(atob(urlToken));
            setUser(userData);
            localStorage.setItem('auth_token', urlToken);
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Invalid token from URL:', error);
          }
        }
        
        // Check for existing token in localStorage
        const token = localStorage.getItem('auth_token');
        if (token) {
          try {
            const userData = JSON.parse(atob(token));
            
            // Check if token is not too old (24 hours)
            const tokenAge = Date.now() - (userData.timestamp || 0);
            if (tokenAge < 24 * 60 * 60 * 1000) {
              setUser(userData);
            } else {
              // Token expired
              localStorage.removeItem('auth_token');
            }
          } catch (error) {
            console.error('Invalid stored token:', error);
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = (provider: 'github' | 'google') => {
    // Redirect to OAuth provider
    window.location.href = `/api/auth/signin/${provider}`;
  };

  const signOut = async () => {
    try {
      // Call backend signout
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      // Clear local state
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signOut,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};