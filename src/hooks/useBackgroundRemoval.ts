import { useState, useCallback } from 'react'
import { resizeImageIfNeeded } from '../lib/image'

export type RemovalStatus = 'idle' | 'loading-lib' | 'processing' | 'done' | 'error' | 'fallback'

export interface UseBackgroundRemovalReturn {
  status: RemovalStatus
  resultBlob: Blob | null
  usedFallback: boolean
  removeBackground: (file: File) => Promise<void>
  reset: () => void
}

export function useBackgroundRemoval(): UseBackgroundRemovalReturn {
  const [status, setStatus] = useState<RemovalStatus>('idle')
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)

  const removeBackground = useCallback(async (file: File) => {
    setStatus('loading-lib')
    setResultBlob(null)
    setUsedFallback(false)

    try {
      // Resize first
      const resized = await resizeImageIfNeeded(file)

      setStatus('processing')

      // Dynamically import to avoid blocking initial load
      const { removeBackground: removeBg } = await import('@imgly/background-removal')

      const result = await removeBg(resized, {
        publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/',
        output: {
          format: 'image/png',
          quality: 0.9,
        },
      })

      setResultBlob(result)
      setStatus('done')
    } catch (err) {
      console.warn('Background removal failed, using fallback:', err)
      // Fallback: use original file
      try {
        const resized = await resizeImageIfNeeded(file)
        setResultBlob(resized)
        setUsedFallback(true)
        setStatus('fallback')
      } catch {
        setStatus('error')
      }
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResultBlob(null)
    setUsedFallback(false)
  }, [])

  return { status, resultBlob, usedFallback, removeBackground, reset }
}
