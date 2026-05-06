import styles from './SharePanel.module.css'

interface SharePanelProps {
  onSaveVideo: () => void
  onNativeShare: () => void
  onTwitterShare: () => void
  onThreadsShare: () => void
  onKakaoShare: () => void
  onCopyLink: () => void
  onReset: () => void
  recordingState: 'idle' | 'recording' | 'done'
  recordProgress: number
  hasNativeShare: boolean
  hasKakao: boolean
}

export function SharePanel({
  onSaveVideo,
  onNativeShare,
  onTwitterShare,
  onThreadsShare,
  onKakaoShare,
  onCopyLink,
  onReset,
  recordingState,
  recordProgress,
  hasNativeShare,
  hasKakao,
}: SharePanelProps) {
  return (
    <div className={styles.container}>
      <div className={styles.resultLabel}>
        <span className={styles.sparkle}>✨</span>
        <p>복복복 완성!</p>
      </div>

      {/* Save Video */}
      <div className={styles.mainAction}>
        <button
          className={`btn-primary ${styles.saveBtn}`}
          onClick={onSaveVideo}
          disabled={recordingState === 'recording'}
        >
          {recordingState === 'idle' && '영상으로 저장'}
          {recordingState === 'recording' && (
            <>
              <span className={styles.recordDot} />
              영상 만드는 중… {Math.round(recordProgress * 100)}%
            </>
          )}
          {recordingState === 'done' && '✓ 저장 완료'}
        </button>
        {recordingState === 'recording' && (
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${recordProgress * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Share buttons */}
      <div className={styles.shareGrid}>
        {hasNativeShare && (
          <button className={styles.shareItem} onClick={onNativeShare}>
            <span className={styles.shareIcon}>📤</span>
            <span>공유하기</span>
          </button>
        )}
        <button className={styles.shareItem} onClick={onTwitterShare}>
          <span className={styles.shareIcon}>𝕏</span>
          <span>X 공유</span>
        </button>
        <button className={styles.shareItem} onClick={onThreadsShare}>
          <span className={styles.shareIcon}>🧵</span>
          <span>Threads</span>
        </button>
        {hasKakao && (
          <button className={`${styles.shareItem} ${styles.kakao}`} onClick={onKakaoShare}>
            <span className={styles.shareIcon}>💬</span>
            <span>카카오톡</span>
          </button>
        )}
        <button className={styles.shareItem} onClick={onCopyLink}>
          <span className={styles.shareIcon}>🔗</span>
          <span>링크 복사</span>
        </button>
      </div>

      {/* Instagram note */}
      <div className={styles.instaNote}>
        <p>📷 인스타 스토리에 올리려면<br />영상을 저장한 뒤 스토리에 추가해 주세요.</p>
      </div>

      {/* Reset */}
      <button className={`btn-ghost ${styles.resetBtn}`} onClick={onReset}>
        다시 만들기
      </button>
    </div>
  )
}
