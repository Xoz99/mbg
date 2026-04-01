'use client'

import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react'

interface MenuPlanning {
  id: string
  mingguanKe: number
  tanggalMulai: string
  tanggalSelesai: string
  sekolahId: string
  sekolah?: { id: string; nama: string }
}

interface DashboardStats {
  totalSekolah: number
  targetHariIni: number
  completedMenus: number
  incompleteMenus: number
}

interface DapurContextType {
  // Data
  menuPlannings: MenuPlanning[]
  sekolahList: any[]
  isLoading: boolean
  error: string | null

  // Methods
  refetchMenuPlannings: () => Promise<void>
  addPlanning: (planning: MenuPlanning) => void
  removePlanning: (planningId: string) => void
}

const DapurContext = createContext<DapurContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

async function getAuthToken(): Promise<string> {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('authToken') || localStorage.getItem('mbg_token') || ''
}

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken()
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.json()
}

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data?.data)) return data.data.data
  if (Array.isArray(data?.data)) return data.data
  return []
}

export function DapurProvider({ children }: { children: ReactNode }) {
  const [menuPlannings, setMenuPlannings] = useState<MenuPlanning[]>([])
  const [sekolahList, setSekolahList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)

  // Fetch menu plannings dan sekolah dilayani
  const fetchMenuPlannings = useCallback(async () => {
    try {
      console.log('🔄 [DapurContext] Starting fetch context data...');
      setIsLoading(true)
      setError(null)

      // Fetch in parallel
      const [planningRes, sekolahRes] = await Promise.all([
        apiCall<any>('/api/menu-planning?limit=100&page=1'),
        apiCall<any>('/api/dapur/sekolah-dilayani')
      ])

      const plannings = extractArray(planningRes.data || [])
      const allSekolahs = extractArray(sekolahRes?.data || [])
      
      // ✅ Only show APPROVED schools on the dashboard
      const approvedSekolahs = allSekolahs.filter(s => s.status === 'APPROVED')

      setMenuPlannings(plannings)
      setSekolahList(approvedSekolahs)

      console.log(`✅ [DapurContext] Data loaded: ${plannings.length} plannings, ${approvedSekolahs.length}/${allSekolahs.length} approved sekolah`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load context data'
      setError(message)
      console.error('❌ [DapurContext] Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load data sekali saat provider mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      fetchMenuPlannings()
    }
  }, [fetchMenuPlannings])

  const refetchMenuPlannings = useCallback(async () => {
    await fetchMenuPlannings()
  }, [fetchMenuPlannings])

  // 🔥 Add planning ke context (for realtime updates)
  const addPlanning = useCallback((planning: MenuPlanning) => {
    setMenuPlannings(prev => [...prev, planning])
    console.log('[DapurContext] ✅ Added planning:', planning.id)
  }, [])

  // 🔥 Remove planning dari context (for realtime updates)
  const removePlanning = useCallback((planningId: string) => {
    setMenuPlannings(prev => prev.filter(p => p.id !== planningId))
    console.log('[DapurContext] ✅ Removed planning:', planningId)
  }, [])

  const value: DapurContextType = {
    menuPlannings,
    sekolahList,
    isLoading,
    error,
    refetchMenuPlannings,
    addPlanning,
    removePlanning,
  }

  return <DapurContext.Provider value={value}>{children}</DapurContext.Provider>
}

export function useDapurContext() {
  const context = useContext(DapurContext)
  if (!context) {
    throw new Error('useDapurContext must be used within DapurProvider')
  }
  return context
}
