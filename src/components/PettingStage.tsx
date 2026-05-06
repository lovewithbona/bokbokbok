import { useRef, useCallback, useState } from 'react'
import { useCanvasPetting } from '../hooks/useCanvasPetting'
import type { PettingState } from '../types'
import styles from './PettingStage.module.css'

const CANVAS_W = 540
const CANVAS_H = 780

interface PettingStageProps {
  imageBlob: Blob
  useFallbackMask: boolean
  onGoToShare: (canvasRef: React.RefObject<HTMLCanvasElement>) => void
}

const PHASE_MESSAGES: Record<PettingState['phase'], string> = {
  idle: '머리 쪽을 살살 문질러 주세요 🐾',
  petting: '복복복…',
  happy: '아주 만족하는 중 ♡',
  share: '이제 공유해 볼까요?',
}

export function PettingStage({ imageBlob, useFallbackMask, onGoToShare }: PettingStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<PettingState['phase']>('idle')

  const handlePettingStateChange = useCallback((state: PettingState) => {
    setPhase(state.phase)
  }, [])

  useCanvasPetting({
    imageBlob,
    useFallbackMask,
    canvasRef,
    onPettingStateChange: handlePettingStateChange,
  })

  const handleShareClick = () => {
    onGoToShare(canvasRef)
  }

  return (
    <div className={`${styles.container} step-enter`}>
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

      <div className={styles.actions}>
        {phase === 'share' ? (
          <button className={`btn-primary ${styles.shareBtn}`} onClick={handleShareClick}>
            저장하고 공유하기 ✨
          </button>
        ) : (
          <button className={`btn-secondary ${styles.shareBtn}`} onClick={handleShareClick}>
            저장하고 공유하기
          </button>
        )}
      </div>
    </div>
  )
}
