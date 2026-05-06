// Kakao JavaScript SDK integration
// Set VITE_KAKAO_JS_KEY in your .env file

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void
      isInitialized: () => boolean
      Share: {
        sendDefault: (options: KakaoShareOptions) => void
      }
    }
  }
}

interface KakaoShareOptions {
  objectType: string
  content: {
    title: string
    description: string
    imageUrl: string
    link: { mobileWebUrl: string; webUrl: string }
  }
  buttons?: Array<{
    title: string
    link: { mobileWebUrl: string; webUrl: string }
  }>
}

const KAKAO_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://bokbokbok.app'

async function loadKakaoSDK(): Promise<void> {
  if (window.Kakao) return

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export async function shareViaKakao(): Promise<boolean> {
  if (!KAKAO_KEY) return false

  try {
    await loadKakaoSDK()
    if (!window.Kakao) return false
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_KEY)
    }

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '복복복~',
        description: '사진 넣고 귀엽게 복복복해 주는 사이트',
        imageUrl: `${SITE_URL}/share-preview.png`,
        link: { mobileWebUrl: SITE_URL, webUrl: SITE_URL },
      },
      buttons: [
        {
          title: '복복복 해 보기',
          link: { mobileWebUrl: SITE_URL, webUrl: SITE_URL },
        },
      ],
    })
    return true
  } catch {
    return false
  }
}

export function isKakaoAvailable(): boolean {
  return Boolean(KAKAO_KEY)
}
