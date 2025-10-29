import { useAuth0 } from '@auth0/auth0-react'
import { User, LogIn, LogOut, Loader } from 'lucide-react'

// Loading component
export const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center text-white">
      <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
      <p>Loading authentication...</p>
    </div>
  </div>
)

// Login component
export const AuthLogin = () => {
  const { loginWithRedirect, isLoading } = useAuth0()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-xl">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Security Monitoring
          </h2>
          <p className="text-gray-400">
            Sign in to access your dashboard
          </p>
        </div>

        <button
          onClick={() => loginWithRedirect()}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <LogIn className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Powered by Auth0 - Secure authentication
        </p>
      </div>
    </div>
  )
}

// User profile dropdown
export const UserProfileDropdown = () => {
  const { user, logout } = useAuth0()

  if (!user) return null

  return (
    <div className="flex items-center space-x-3">
      {user.picture && (
        <img
          src={user.picture}
          alt={user.name || 'User'}
          className="w-8 h-8 rounded-full"
        />
      )}
      
      <div className="hidden md:block text-sm">
        <p className="text-white font-medium">{user.name}</p>
        <p className="text-gray-400 text-xs">{user.email}</p>
      </div>

      <button
        onClick={() => logout({ 
          logoutParams: { 
            returnTo: window.location.origin 
          } 
        })}
        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )
}

// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoading, isAuthenticated } = useAuth0()

  if (isLoading) {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    return <AuthLogin />
  }

  return <>{children}</>
}