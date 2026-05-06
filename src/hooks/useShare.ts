import { useState, useCallback } from 'react'
import { shareFile, openTwitterShare, openThreadsShare, copyLink, canNativeShare } from '../lib/share'
import { shareViaKakao, isKakaoAvailable } from '../lib/kakao'

export interface UseShareReturn {
  isSharing: boolean
  showFallbackPanel: boolean
  share: (file?: File) => Promise<void>
  shareToTwitter: () => void
  shareToThreads: () => void
  shareToKakao: () => Promise<void>
  copyPageLink: () => Promise<boolean>
  canNativeShare: boolean
  hasKakao: boolean
  closeFallbackPanel: () => void
}

export function useShare(onCopySuccess?: () => void): UseShareReturn {
  const [isSharing, setIsSharing] = useState(false)
  const [showFallbackPanel, setShowFallbackPanel] = useState(false)

  const share = useCallback(async (file?: File) => {
    setIsSharing(true)
    try {
      if (file) {
        const result = await shareFile(file)
        if (!result.success && result.method === 'fallback') {
          setShowFallbackPanel(true)
        }
      } else {
        if (canNativeShare()) {
          await shareFile(undefined as unknown as File)
        } else {
          setShowFallbackPanel(true)
        }
      }
    } finally {
      setIsSharing(false)
    }
  }, [])

  const shareToTwitter = useCallback(() => {
    openTwitterShare()
  }, [])

  const shareToThreads = useCallback(() => {
    openThreadsShare()
  }, [])

  const shareToKakao = useCallback(async () => {
    const success = await shareViaKakao()
    if (!success) {
      setShowFallbackPanel(true)
    }
  }, [])

  const copyPageLink = useCallback(async () => {
    const success = await copyLink()
    if (success) onCopySuccess?.()
    return success
  }, [onCopySuccess])

  return {
    isSharing,
    showFallbackPanel,
    share,
    shareToTwitter,
    shareToThreads,
    shareToKakao,
    copyPageLink,
    canNativeShare: canNativeShare(),
    hasKakao: isKakaoAvailable(),
    closeFallbackPanel: () => setShowFallbackPanel(false),
  }
}
