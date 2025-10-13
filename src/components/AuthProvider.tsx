// Custom Auth Provider for Vite React App
import { ReactNode } from 'react';
import { useAuthProvider } from '../hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuthProvider();

  return (
    <auth.AuthContext.Provider value={auth}>
      {children}
    </auth.AuthContext.Provider>
  );
};