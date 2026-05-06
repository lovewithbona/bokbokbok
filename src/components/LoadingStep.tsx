import type { RemovalStatus } from '../hooks/useBackgroundRemoval'
import styles from './LoadingStep.module.css'

interface LoadingStepProps {
  status: RemovalStatus
  onRetry: () => void
}

export function LoadingStep({ status, onRetry }: LoadingStepProps) {
  const isError = status === 'error'

  if (isError) {
    return (
      <div className={`${styles.container} step-enter`}>
        <div className={styles.errorIcon}>😢</div>
        <p className={styles.errorTitle}>사진을 잘 못 알아봤어요</p>
        <p className={styles.errorSub}>더 선명한 사진으로 다시 시도해 주세요.</p>
        <button className={`btn-primary ${styles.retryBtn}`} onClick={onRetry}>
          다시 해 보기
        </button>
      </div>
    )
  }

  const loadingText = status === 'loading-lib'
    ? '배경 제거 준비 중…'
    : '복복복 준비 중…'

  const loadingSub = status === 'loading-lib'
    ? '처음 한 번만 조금 걸려요.'
    : '사진에서 대상을 살짝 분리하고 있어요.'

  return (
    <div className={`${styles.container} step-enter`}>
      <div className={styles.dotsWrapper}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      <p className={styles.loadingTitle}>{loadingText}</p>
      <p className={styles.loadingSub}>{loadingSub}</p>
    </div>
  )
}
