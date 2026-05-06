export interface ShareResult {
  method: 'native' | 'fallback'
  success: boolean
}

const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://bokbokbok.app'
const SHARE_TEXT = '나 지금 복복복 해 주는 중… 너도 해 봐 👉'
const SHARE_TITLE = '복복복~'

export async function shareFile(file: File): Promise<ShareResult> {
  if (!navigator.share) return { method: 'fallback', success: false }

  const canShareFile = navigator.canShare?.({ files: [file] }) ?? false

  try {
    if (canShareFile) {
      await navigator.share({
        title: SHARE_TITLE,
        text: SHARE_TEXT,
        url: SITE_URL,
        files: [file],
      })
      return { method: 'native', success: true }
    } else {
      await navigator.share({
        title: SHARE_TITLE,
        text: SHARE_TEXT,
        url: SITE_URL,
      })
      return { method: 'native', success: true }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return { method: 'native', success: false }
    }
    return { method: 'fallback', success: false }
  }
}

export function openTwitterShare() {
  const text = encodeURIComponent(`${SHARE_TEXT}\n${SITE_URL}`)
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener')
}

export function openThreadsShare() {
  const text = encodeURIComponent(`${SHARE_TEXT} ${SITE_URL}`)
  const url = `https://www.threads.net/intent/post?text=${text}`
  window.open(url, '_blank', 'noopener')
}

export async function copyLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(SITE_URL)
    return true
  } catch {
    // Fallback
    const ta = document.createElement('textarea')
    ta.value = SITE_URL
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }
}

export function canNativeShare(): boolean {
  return typeof navigator.share === 'function'
}
