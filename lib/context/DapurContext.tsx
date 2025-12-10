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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)

  // Fetch menu plannings sekali saja
  const fetchMenuPlannings = useCallback(async () => {
    try {
      console.log('🔄 [DapurContext] Starting fetch menu plannings...');
      setIsLoading(true)
      setError(null)

      const planningRes = await apiCall<any>('/api/menu-planning?limit=100&page=1')
      const plannings = extractArray(planningRes.data || [])
      setMenuPlannings(plannings)

      if (plannings.length > 0) {
        console.log(`✅ [DapurContext] Menu plannings loaded: ${plannings.length} items`)
        console.log('[DapurContext] Sample planning:', {
          id: plannings[0].id,
          sekolah: plannings[0].sekolah?.nama,
          mingguanKe: plannings[0].mingguanKe
        })
      } else {
        console.warn('⚠️ [DapurContext] No menu plannings returned from API')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load menu plannings'
      setError(message)
      console.error('❌ [DapurContext] Error fetching menu plannings:', err)
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
