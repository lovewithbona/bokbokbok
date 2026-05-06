import { useState, useCallback, useRef, useEffect } from 'react'
import type { AppStep, PettingState } from './types'
import { useBackgroundRemoval } from './hooks/useBackgroundRemoval'
import { useCanvasPetting } from './hooks/useCanvasPetting'
import { Header } from './components/Header'
import { UploadStep } from './components/UploadStep'
import { LoadingStep } from './components/LoadingStep'
import { SharePanel } from './components/SharePanel'
import { ToastContainer, useToast } from './components/Toast'
import { recordCanvas, downloadBlob, canRecord } from './lib/recorder'
import { shareFile, openTwitterShare, openThreadsShare, copyLink, canNativeShare } from './lib/share'
import { shareViaKakao, isKakaoAvailable } from './lib/kakao'
import styles from './App.module.css'

const CANVAS_W = 540
const CANVAS_H = 780
const RECORD_DURATION = 5000

const PHASE_MESSAGES: Record<PettingState['phase'], string> = {
  idle: '머리 쪽을 살살 문질러 주세요 🐾',
  petting: '복복복…',
  happy: '아주 만족하는 중 ♡',
  share: '이제 공유해 볼까요?',
}

export default function App() {
  const [step, setStep] = useState<AppStep>('upload')
  const [phase, setPhase] = useState<PettingState['phase']>('idle')
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'done'>('idle')
  const [recordProgress, setRecordProgress] = useState(0)

  const { status, resultBlob, usedFallback, removeBackground, reset: resetBgRemoval } = useBackgroundRemoval()
  const { toasts, showToast } = useToast()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const savedFileRef = useRef<File | null>(null)

  const { startAutoAnimation, stopAutoAnimation } = useCanvasPetting({
    imageBlob: resultBlob,
    useFallbackMask: usedFallback,
    canvasRef,
    onPettingStateChange: (s) => setPhase(s.phase),
  })

  useEffect(() => {
    if ((status === 'done' || status === 'fallback') && step === 'loading') {
      setStep('petting')
      if (usedFallback) {
        showToast('배경 제거를 건너뛰고 원본 사진으로 진행했어요.')
      }
    }
  }, [status, step, usedFallback, showToast])

  const handleFileSelect = useCallback(async (file: File) => {
    setStep('loading')
    await removeBackground(file)
  }, [removeBackground])

  const handleReset = useCallback(() => {
    resetBgRemoval()
    savedFileRef.current = null
    setPhase('idle')
    setRecordingState('idle')
    setRecordProgress(0)
    setStep('upload')
  }, [resetBgRemoval])

  const handleBack = useCallback(() => {
    if (step === 'share') {
      setStep('petting')
    } else if (step === 'petting') {
      resetBgRemoval()
      savedFileRef.current = null
      setPhase('idle')
      setStep('upload')
    }
  }, [step, resetBgRemoval])

  const handleSaveVideo = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || recordingState !== 'idle') return

    if (!canRecord()) {
      canvas.toBlob((blob) => {
        if (!blob) return
        downloadBlob(blob, 'bokbokbok-result.png')
        showToast('이미지로 저장했어요!')
      }, 'image/png')
      return
    }

    setRecordingState('recording')
    setRecordProgress(0)
    startAutoAnimation(RECORD_DURATION)

    try {
      const result = await recordCanvas(canvas, RECORD_DURATION, setRecordProgress)
      stopAutoAnimation()
      const filename = `bokbokbok-result.${result.extension}`
      const file = new File([result.blob], filename, { type: result.mimeType })
      savedFileRef.current = file
      downloadBlob(result.blob, filename)
      setRecordingState('done')
      showToast('영상을 저장했어요! 이제 공유해 보세요 🎉')
    } catch {
      stopAutoAnimation()
      setRecordingState('idle')
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, 'bokbokbok-result.png')
      }, 'image/png')
      showToast('영상 저장이 안 되어서 이미지로 저장했어요.')
    }
  }, [recordingState, startAutoAnimation, stopAutoAnimation, showToast])

  const handleNativeShare = useCallback(async () => {
    const file = savedFileRef.current
    if (file) {
      await shareFile(file)
    } else if (canNativeShare()) {
      try {
        await navigator.share({
          title: '복복복~',
          text: '나 지금 복복복 해 주는 중… 너도 해 봐',
          url: window.location.origin,
        })
      } catch { /* user cancelled */ }
    } else {
      showToast('먼저 영상을 저장해 주세요!')
    }
  }, [showToast])

  const handleCopyLink = useCallback(async () => {
    const ok = await copyLink()
    if (ok) showToast('링크를 복사했어요 ✓')
  }, [showToast])

  const handleKakao = useCallback(async () => {
    const ok = await shareViaKakao()
    if (!ok) await handleCopyLink()
  }, [handleCopyLink])

  const showBack = step === 'petting' || step === 'share'

  return (
    <div className="app-shell">
      <Header showBack={showBack} onBack={handleBack} />

      {step === 'upload' && (
        <UploadStep onFileSelect={handleFileSelect} onError={showToast} />
      )}

      {step === 'loading' && (
        <LoadingStep status={status} onRetry={handleReset} />
      )}

      {resultBlob && step === 'petting' && (
        <div className={`${styles.pettingInner} step-enter`}>
          <div className={styles.canvasWrapper}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className={styles.canvas}
              style={{ touchAction: 'none' }}
            />
            <div className={`${styles.phaseMsg} ${phase !== 'idle' ? styles.phaseMsgActive : ''}`}>
              {PHASE_MESSAGES[phase]}
            </div>
          </div>
          <div className={styles.pettingActions}>
            <button
              className={phase === 'share'
                ? `btn-primary ${styles.pettingBtn}`
                : `btn-secondary ${styles.pettingBtn}`}
              onClick={() => setStep('share')}
            >
              저장하고 공유하기{phase === 'share' ? ' ✨' : ''}
            </button>
          </div>
        </div>
      )}

      {resultBlob && step === 'share' && (
        <div className={`step-enter`} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Keep canvas hidden but rendering for recording */}
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', top: -9999 }}
          />
          <SharePanel
            onSaveVideo={handleSaveVideo}
            onNativeShare={handleNativeShare}
            onTwitterShare={openTwitterShare}
            onThreadsShare={openThreadsShare}
            onKakaoShare={handleKakao}
            onCopyLink={handleCopyLink}
            onReset={handleReset}
            recordingState={recordingState}
            recordProgress={recordProgress}
            hasNativeShare={canNativeShare()}
            hasKakao={isKakaoAvailable()}
          />
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
