//src/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api, { initCsrf } from '@/services/api'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  name: string
  email: string
  phone: string
  is_provider: boolean
}

interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
  is_provider: boolean
}

interface LoginData {
  email: string
  password: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  register: (data: RegisterData) => Promise<void>
  login: (data: LoginData) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api
        .get('/api/me')
        .then(res => setUser(res.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function register(form: RegisterData) {
    await initCsrf()
    const { data } = await api.post('/api/register', form)
    localStorage.setItem('token', data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    router.push('/dashboard')
  }

  async function login(form: LoginData) {
    await initCsrf()
    const { data } = await api.post('/api/login', form)
    localStorage.setItem('token', data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    router.push('/dashboard')
  }

  async function logout() {
    await api.post('/api/logout')
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    router.push('/auth/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
