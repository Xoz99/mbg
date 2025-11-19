'use client'

import { DapurProvider } from '@/lib/context/DapurContext'
import { ReactNode } from 'react'

export default function DapurLayout({ children }: { children: ReactNode }) {
  return <DapurProvider>{children}</DapurProvider>
}
