// src/app/layout.tsx

"use client";
import './globals.css'
import { Toaster } from 'react-hot-toast';

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
      <body className="bg-gradient-to-r from-indigo-50 to-purple-100 text-gray-800">
        <Toaster position="top-right" />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
