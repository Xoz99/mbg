'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

const API_BASE_URL = 'https://demombgv1.xyz'

export const useTraySummaryRealtime = (sekolahId: string) => {
  const [traySummary, setTraySummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttemptsRef = useRef(5)

  // 🔥 FETCH via HTTP initially
  const fetchTraySummary = useCallback(async () => {
    if (!sekolahId) return

    setLoading(true)
    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('mbg_token') || localStorage.getItem('authToken')
        : ''

      const response = await fetch(`${API_BASE_URL}/api/rfid/tray-summary?sekolahId=${sekolahId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[TraySummary] Full response:', data)

        // Try multiple paths untuk ambil data
        const trayData = data.data || data
        console.log('[TraySummary] Extracted data:', trayData)
        console.log('[TraySummary] totalTrayUnik:', trayData?.totalTrayUnik)

        setTraySummary(trayData)
        setError(null)
      } else {
        setError('Gagal memuat data tray summary')
      }
    } catch (err) {
      console.warn('[TraySummary] Gagal fetch tray summary:', err)
      setError(err instanceof Error ? err.message : 'Error fetching tray summary')
    } finally {
      setLoading(false)
    }
  }, [sekolahId])

  // 🔥 SETUP WEBSOCKET for realtime updates
  const setupWebSocket = useCallback(() => {
    if (!sekolahId || isConnectingRef.current) return

    isConnectingRef.current = true

    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('mbg_token') || localStorage.getItem('authToken')
        : ''

      if (!token) {
        console.warn('[TraySummary] No token found, skipping WebSocket')
        isConnectingRef.current = false
        return
      }

      // Pass token as query param since WebSocket doesn't support custom headers
      const wsUrl = `wss://demombgv1.xyz/api/rfid/tray-summary-ws?sekolahId=${sekolahId}&token=${encodeURIComponent(token)}`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[TraySummary] ✅ WebSocket connected for sekolah:', sekolahId)
        isConnectingRef.current = false
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('[TraySummary] 📨 Received realtime update:', message)

          // Extract data from the message
          const trayData = message.data || message
          console.log('[TraySummary] Tray data:', trayData)

          setTraySummary(trayData)
        } catch (err) {
          console.warn('[TraySummary] Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = (error) => {
        console.warn('[TraySummary] WebSocket error:', error)
        wsRef.current = null
        isConnectingRef.current = false
      }

      ws.onclose = (event) => {
        console.log('[TraySummary] WebSocket closed:', event.code, event.reason)
        wsRef.current = null
        isConnectingRef.current = false
      }

      wsRef.current = ws
    } catch (err) {
      console.error('[TraySummary] Error setting up WebSocket:', err)
      isConnectingRef.current = false
    }
  }, [sekolahId])

  // 🔥 SETUP POLLING as fallback when WebSocket not available
  const setupPolling = useCallback(() => {
    if (!sekolahId) return

    // Poll every 5 seconds as fallback
    const pollingInterval = setInterval(() => {
      fetchTraySummary()
    }, 5000)

    return () => clearInterval(pollingInterval)
  }, [sekolahId, fetchTraySummary])

  // 🔥 INITIALIZE - fetch HTTP first, then setup WebSocket + polling fallback
  useEffect(() => {
    if (!sekolahId) return

    // Fetch initial data via HTTP
    fetchTraySummary()

    // Try to setup WebSocket for realtime
    setupWebSocket()

    // Setup polling as fallback (every 5 seconds)
    const cleanupPolling = setupPolling()

    return () => {
      // Cleanup WebSocket on unmount
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      // Cleanup polling
      if (cleanupPolling) {
        cleanupPolling()
      }
    }
  }, [sekolahId, fetchTraySummary, setupWebSocket, setupPolling])

  // 🔥 Manual refresh
  const refresh = useCallback(() => {
    fetchTraySummary()
  }, [fetchTraySummary])

  return {
    traySummary,
    loading,
    error,
    refresh,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  }
}
