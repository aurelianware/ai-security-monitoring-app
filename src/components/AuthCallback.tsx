import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export const AuthCallback = () => {
  const { setUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        window.location.href = '/';
        return;
      }

      if (code && state) {
        try {
          // For now, we'll simulate getting user data
          // In a real app, you'd exchange the code for tokens on your backend
          
          if (state === 'google') {
            // Simulate Google user data
            const mockUser = {
              id: `google_${Date.now()}`,
              email: 'user@example.com',
              name: 'Demo User',
              picture: 'https://via.placeholder.com/64',
              provider: 'google'
            };
            
            setUser(mockUser);
            localStorage.setItem('auth_user', JSON.stringify(mockUser));
          } else if (state === 'github') {
            // Simulate GitHub user data
            const mockUser = {
              id: `github_${Date.now()}`,
              email: 'user@example.com',
              name: 'Demo User',
              picture: 'https://via.placeholder.com/64',
              provider: 'github'
            };
            
            setUser(mockUser);
            localStorage.setItem('auth_user', JSON.stringify(mockUser));
          }

          // Redirect to home page
          window.location.href = '/';
        } catch (error) {
          console.error('Error processing callback:', error);
          window.location.href = '/';
        }
      }
    };

    handleCallback();
  }, [setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing sign in...</p>
      </div>
    </div>
  );
};