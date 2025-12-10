'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

interface UsageHistoryItem {
  date: string
  in: number
  out: number
}

export const useStokUsageHistory = (token: string, dapurId: string) => {
  const [usageHistory, setUsageHistory] = useState<UsageHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)
  const updateCounterRef = useRef(0)

  // Helper: Get last 7 days
  const getLast7Days = useCallback(() => {
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      days.push(`${day}/${month}`)
    }
    return days
  }, [])

  // Fetch stock movements from API
  const fetchUsageHistory = useCallback(async () => {
    if (!token || !dapurId) {
      setError('Token atau Dapur ID tidak ditemukan')
      setLoading(false)
      return
    }

    try {
      console.log('[USAGE HISTORY] Starting fetch...')
      setLoading(true)
      setError(null)

      // Fetch all stok items
      const stokRes = await fetch(
        `${API_BASE_URL}/api/dapur/${dapurId}/stok?page=1&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!stokRes.ok) {
        throw new Error('Gagal mengambil data stok')
      }

      const stokData = await stokRes.json()
      let stokList = []

      if (Array.isArray(stokData.data?.data)) {
        stokList = stokData.data.data
      } else if (Array.isArray(stokData.data)) {
        stokList = stokData.data
      } else if (Array.isArray(stokData)) {
        stokList = stokData
      }

      console.log('[USAGE HISTORY] Stok items loaded:', stokList.length)

      // Initialize 7 days with zeros
      const last7Days = getLast7Days()
      const historyMap = new Map<string, { in: number; out: number }>()

      last7Days.forEach((date) => {
        historyMap.set(date, { in: 0, out: 0 })
      })

      // Aggregate movement data from stok items
      // Since individual stok items don't have per-date history,
      // we'll use createdAt and adjustment history if available
      stokList.forEach((item: any) => {
        if (item.createdAt) {
          const date = new Date(item.createdAt)
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const dateKey = `${day}/${month}`

          if (historyMap.has(dateKey)) {
            const current = historyMap.get(dateKey)!
            // Treat initial stock as incoming
            current.in += item.stokKg || 0
            historyMap.set(dateKey, current)
          }
        }

        // If item has movement/adjustment history (if API provides it)
        if (item.movements && Array.isArray(item.movements)) {
          item.movements.forEach((movement: any) => {
            const date = new Date(movement.date || movement.createdAt)
            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const dateKey = `${day}/${month}`

            if (historyMap.has(dateKey)) {
              const current = historyMap.get(dateKey)!
              const amount = Math.abs(movement.amount || movement.adjustment || 0)
              if (movement.type === 'IN' || movement.amount > 0) {
                current.in += amount
              } else {
                current.out += amount
              }
              historyMap.set(dateKey, current)
            }
          })
        }
      })

      // Convert map to array
      const history: UsageHistoryItem[] = last7Days.map((date) => ({
        date,
        in: historyMap.get(date)?.in || 0,
        out: historyMap.get(date)?.out || 0,
      }))

      setUsageHistory(history)
      console.log('[USAGE HISTORY] ✅ History loaded:', history)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data'
      setError(message)
      console.error('[USAGE HISTORY] ❌ Error:', err)
    } finally {
      setLoading(false)
    }
  }, [token, dapurId, getLast7Days])

  // Initialize on mount
  useEffect(() => {
    if (!token || !dapurId) {
      console.log('[USAGE HISTORY] Waiting for token or dapurId...')
      return
    }

    if (!hasInitialized.current) {
      hasInitialized.current = true
      fetchUsageHistory()
    }
  }, [token, dapurId, fetchUsageHistory])

  // Refresh data when stock is updated
  const refreshUsageHistory = useCallback(async () => {
    console.log('[USAGE HISTORY] Refreshing...')
    updateCounterRef.current += 1
    await fetchUsageHistory()
  }, [fetchUsageHistory])

  // Trigger refresh on any stock update (called from parent)
  const onStockUpdated = useCallback(() => {
    console.log('[USAGE HISTORY] Stock updated event received')
    refreshUsageHistory()
  }, [refreshUsageHistory])

  return {
    usageHistory,
    loading,
    error,
    refreshUsageHistory,
    onStockUpdated,
  }
}
