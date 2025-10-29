// Session Provider for Custom React Auth
'use client'

import { ReactNode } from 'react'
import { AuthProvider as CustomAuthProvider } from '../contexts/AuthContext'

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  return <CustomAuthProvider>{children}</CustomAuthProvider>
}