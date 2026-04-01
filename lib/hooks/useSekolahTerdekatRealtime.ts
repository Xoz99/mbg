'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

interface SekolahWithDistance {
  id: string
  name: string
  email?: string
  phone?: string
  alamat?: string
  latitude?: number
  longitude?: number
  siswaCount?: number
  distance: number
  isLinked?: boolean
  status?: string // PENDING, APPROVED, REJECTED
}

interface DapurInfo {
  id: string
  nama: string
  latitude?: number
  longitude?: number
}

// Helper functions
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

async function getAuthToken(): Promise<string> {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('authToken') || localStorage.getItem('mbg_token') || ''
}

// 🔥 REQUEST QUEUE - limit concurrent API calls (max 3)
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private running = 0
  private maxConcurrent = 3

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) return
    this.running++
    const fn = this.queue.shift()
    if (fn) {
      await fn()
      this.running--
      this.process()
    }
  }
}

const requestQueue = new RequestQueue()

export const useSekolahTerdekatRealtime = (token: string, dapurId: string) => {
  const [dapurInfo, setDapurInfo] = useState<DapurInfo | null>(null)
  const [sekolahList, setSekolahList] = useState<SekolahWithDistance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)

  // 🔥 MAIN FETCH - Dapur info + semua sekolah dengan distance + siswa count
  const fetchData = useCallback(async () => {
    if (!token || !dapurId) {
      setError('Token atau Dapur ID tidak ditemukan')
      setLoading(false)
      return
    }

    try {
      console.log('[SEKOLAH TERDEKAT] Starting fetch...')
      setLoading(true)
      setError(null)

      // 1️⃣ Fetch dapur info
      const dapurRes = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!dapurRes.ok) {
        throw new Error('Gagal memuat data dapur')
      }

      const dapurData = await dapurRes.json()
      const dapur = dapurData.data || dapurData

      if (!dapur.latitude || !dapur.longitude) {
        throw new Error('Dapur tidak memiliki koordinat lokasi')
      }

      const dapurInfo: DapurInfo = {
        id: dapur.id,
        nama: dapur.nama || dapur.name,
        latitude: dapur.latitude,
        longitude: dapur.longitude,
      }

      setDapurInfo(dapurInfo)
      console.log('[SEKOLAH TERDEKAT] ✅ Dapur info loaded:', dapurInfo.nama)

      // 2️⃣ Fetch all sekolah
      const sekolahRes = await fetch(`${API_BASE_URL}/api/sekolah?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!sekolahRes.ok) {
        throw new Error('Gagal memuat data sekolah')
      }

      const sekolahData = await sekolahRes.json()
      let sekolahListData = []

      if (Array.isArray(sekolahData.data?.data)) {
        sekolahListData = sekolahData.data.data
      } else if (Array.isArray(sekolahData.data)) {
        sekolahListData = sekolahData.data
      } else if (Array.isArray(sekolahData)) {
        sekolahListData = sekolahData
      }

      // 3️⃣ Get linked sekolah info (including status)
      const linkedMap = new Map<string, string>() // sekolahId -> status
      const extractLinks = (links: any[]) => {
        if (!Array.isArray(links)) return
        links.forEach((link: any) => {
          const id = link.sekolahId || link.sekolah?.id || (typeof link === 'string' ? link : link.id)
          const status = link.status || 'PENDING' // Use real status from backend, default to PENDING
          if (id) linkedMap.set(id, status)
        })
      }

      if (dapur.sekolahDilayani) extractLinks(dapur.sekolahDilayani)
      else if (dapur.linkedSekolah) extractLinks(dapur.linkedSekolah)
      else if (dapur.sekolah) extractLinks(dapur.sekolah)

      console.log('[SEKOLAH TERDEKAT] Linked sekolah count:', linkedMap.size)

      // 4️⃣ Calculate distances
      let sekolahWithDistance = sekolahListData
        .map((s: any) => ({
          id: s.id,
          name: s.nama || s.name,
          email: s.email,
          phone: s.phone,
          alamat: s.alamat || s.address || '',
          latitude: s.latitude,
          longitude: s.longitude,
          siswaCount: 0,
          distance: Math.round(calculateDistance(
            dapurInfo.latitude || 0,
            dapurInfo.longitude || 0,
            s.latitude || 0,
            s.longitude || 0
          ) * 100) / 100,
          isLinked: linkedMap.has(s.id),
          status: linkedMap.get(s.id),
        }))
        .sort((a: SekolahWithDistance, b: SekolahWithDistance) => a.distance - b.distance)

      console.log('[SEKOLAH TERDEKAT] Calculated distances for', sekolahWithDistance.length, 'sekolah')

      // 5️⃣ Fetch siswa count with request queue (max 3 concurrent)
      console.log('[SEKOLAH TERDEKAT] Fetching siswa count via request queue...')
      const sekolahWithSiswaCount = await Promise.allSettled(
        sekolahWithDistance.map((sekolah: SekolahWithDistance) =>
          requestQueue.add(async () => {
            try {
              const siswaRes = await fetch(`${API_BASE_URL}/api/sekolah/${sekolah.id}/siswa`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              })

              if (siswaRes.ok) {
                const siswaData = await siswaRes.json()
                let siswaList = []

                if (Array.isArray(siswaData.data?.data)) {
                  siswaList = siswaData.data.data
                } else if (Array.isArray(siswaData.data)) {
                  siswaList = siswaData.data
                } else if (Array.isArray(siswaData)) {
                  siswaList = siswaData
                }

                return {
                  ...sekolah,
                  siswaCount: siswaList.length,
                }
              }
              return sekolah
            } catch (err) {
              console.warn(`[SEKOLAH TERDEKAT] Failed to fetch siswa for ${sekolah.id}`)
              return sekolah
            }
          })
        )
      ).then((results: any[]) =>
        results
          .filter((result: any) => result.status === 'fulfilled')
          .map((result: any) => result.value)
      )

      setSekolahList(sekolahWithSiswaCount)
      console.log('[SEKOLAH TERDEKAT] ✅ All data loaded:', sekolahWithSiswaCount.length, 'sekolah')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data'
      setError(message)
      console.error('[SEKOLAH TERDEKAT] ❌ Error:', err)
    } finally {
      setLoading(false)
    }
  }, [token, dapurId])

  // 🔥 Initialize on mount - wait until token and dapurId are ready
  useEffect(() => {
    // If token or dapurId is empty, don't initialize yet
    if (!token || !dapurId) {
      console.log('[SEKOLAH TERDEKAT] Waiting for token or dapurId...')
      return
    }

    if (!hasInitialized.current) {
      hasInitialized.current = true
      fetchData()
    }
  }, [token, dapurId, fetchData])

  // 🔥 Refresh data
  const refreshData = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  // 🔥 Update linked status (realtime)
  const updateSekolahLinked = useCallback((sekolahId: string, isLinked: boolean) => {
    setSekolahList(prev =>
      prev.map(s => (s.id === sekolahId ? { ...s, isLinked } : s))
    )
    console.log('[SEKOLAH TERDEKAT] ✅ Updated sekolah linked status:', sekolahId, isLinked)
  }, [])

  // 🔥 Invite sekolah
  const inviteSekolah = useCallback(async (sekolahId: string) => {
    if (!token || !dapurId) return { success: false, message: 'Auth info error' }

    try {
      const res = await fetch(`${API_BASE_URL}/api/sekolah/${sekolahId}/link-dapur`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dapurId }),
      })

      const data = await res.json()
      if (res.ok) {
        setSekolahList(prev =>
          prev.map(s => (s.id === sekolahId ? { ...s, isLinked: true, status: 'PENDING' } : s))
        )
        return { success: true, message: 'Undangan berhasil dikirim' }
      } else {
        throw new Error(data.message || 'Gagal mengirim undangan')
      }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }, [token, dapurId])

  return {
    dapurInfo,
    sekolahList,
    loading,
    error,
    refreshData,
    updateSekolahLinked,
    inviteSekolah,
  }
}
