'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDapurContext } from '@/lib/context/DapurContext'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

// 🔥 REALTIME CACHE - NO STALE DATA!
// Hanya cache dari context, tidak dari localStorage
// Validasi dengan context untuk consistency

export const useMenuPlanningRealtime = () => {
  const { menuPlannings: contextPlannings, isLoading: contextLoading, addPlanning: addToContext, removePlanning: removeFromContext } = useDapurContext()
  const [menuPlannings, setMenuPlannings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const hasInitialized = useRef(false)
  const planningsRef = useRef<any[]>([])

  // 🔥 SYNC dengan context - source of truth
  useEffect(() => {
    if (contextLoading) {
      console.log('[REALTIME] Waiting for context...')
      return
    }

    if (!hasInitialized.current) {
      console.log('[REALTIME] ✅ Syncing with context, plannings:', contextPlannings.length)
      const data = [...contextPlannings]
      setMenuPlannings(data)
      planningsRef.current = data // Keep ref in sync
      setLoading(false)
      hasInitialized.current = true
    }
  }, [contextPlannings, contextLoading])

  // Keep ref in sync dengan state
  useEffect(() => {
    planningsRef.current = menuPlannings
  }, [menuPlannings])

  // 🔥 ADD PLANNING - Immediate update + API sync
  const addMenuPlanning = useCallback(
    async (planningData: any) => {
      console.log('[REALTIME ADD] Adding planning:', planningData)

      try {
        // 1️⃣ Optimistic add ke UI
        const tempPlanning = {
          id: `temp-${Date.now()}`,
          ...planningData,
          status: 'INCOMPLETE',
        }

        setMenuPlannings(prev => [...prev, tempPlanning])
        console.log('[REALTIME ADD] ✅ Optimistic add - now have', menuPlannings.length + 1, 'plannings')

        // 2️⃣ API call
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('authToken') || localStorage.getItem('mbg_token')
          : ''

        const response = await fetch(`${API_BASE_URL}/api/menu-planning`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(planningData),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        const newPlanning = result?.data || result

        console.log('[REALTIME ADD] API created planning with ID:', newPlanning.id)

        // 3️⃣ Replace temp ID dengan real ID
        setMenuPlannings(prev =>
          prev.map(p =>
            p.id === tempPlanning.id ? { ...newPlanning, status: 'INCOMPLETE' } : p
          )
        )

        // 4️⃣ SYNC dengan context (source of truth untuk refresh)
        addToContext({ ...newPlanning, status: 'INCOMPLETE' })

        return newPlanning
      } catch (err) {
        console.error('[REALTIME ADD] ❌ Error:', err)

        // Rollback optimistic add jika error
        setMenuPlannings(prev => prev.filter(p => p.id !== `temp-${Date.now()}`))
        throw err
      }
    },
    [addToContext]
  )

  // 🔥 DELETE PLANNING - Immediate remove + API sync
  const deleteMenuPlanning = useCallback(
    async (planningId: string) => {
      console.log('[REALTIME DELETE] Deleting planning:', planningId)

      try {
        // 1️⃣ Capture original data dari ref untuk rollback
        const originalData = [...planningsRef.current]

        // 2️⃣ Optimistic remove dari UI DULU (PENTING!)
        setMenuPlannings(prev => prev.filter(p => p.id !== planningId))
        console.log('[REALTIME DELETE] ✅ Optimistic remove')

        // 3️⃣ API call DELETE
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('authToken') || localStorage.getItem('mbg_token')
          : ''

        const response = await fetch(`${API_BASE_URL}/api/menu-planning/${planningId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        // 4️⃣ SYNC dengan context (remove dari source of truth)
        removeFromContext(planningId)

        console.log('[REALTIME DELETE] ✅ API delete success')
        return true

      } catch (err) {
        console.error('[REALTIME DELETE] ❌ Error:', err)

        // Rollback: restore original data dari ref jika error
        setMenuPlannings(originalData)
        console.log('[REALTIME DELETE] Restored data after error')
        throw err
      }
    },
    [removeFromContext]
  )

  return {
    menuPlannings,
    loading,
    addMenuPlanning,
    deleteMenuPlanning,
  }
}
