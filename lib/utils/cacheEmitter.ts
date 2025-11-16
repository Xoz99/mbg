/**
 * Custom Event Emitter untuk Unified Cache
 * Memungkinkan instant synchronization antar component dalam 1 tab
 * tanpa perlu pindah halaman
 */

type CacheListener = (data: any) => void

class CacheEmitter {
  private listeners: Map<string, Set<CacheListener>> = new Map()

  /**
   * Subscribe ke cache updates dengan key tertentu
   */
  subscribe(key: string, listener: CacheListener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(listener)

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(listener)
    }
  }

  /**
   * Emit cache update ke semua listeners yang subscribe
   */
  emit(key: string, data: any): void {
    console.log(`📢 [CACHE EMITTER] Emitting update for key: ${key}`)
    const listenersSet = this.listeners.get(key)
    if (listenersSet) {
      listenersSet.forEach((listener) => {
        try {
          listener(data)
        } catch (err) {
          console.error(`[CACHE EMITTER] Error in listener:`, err)
        }
      })
    }
  }

  /**
   * Clear semua listeners (untuk cleanup)
   */
  clear(): void {
    this.listeners.clear()
  }
}

// Export singleton instance
export const cacheEmitter = new CacheEmitter()
