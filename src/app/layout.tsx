// src/app/layout.tsx

"use client";
import './globals.css'

// 1dynamically import the AuthProvider so it's purely client‑side
import dynamic from 'next/dynamic'
const AuthProvider = dynamic(
  () => import('@/context/AuthContext').then((mod) => mod.AuthProvider),
  { ssr: false }
)

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {/* Now AuthProvider is a client‑only boundary — no server serialization */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
