import { useRef, useCallback } from 'react'
import { isValidImageType, isFileTooSmall } from '../lib/image'
import styles from './UploadStep.module.css'

interface UploadStepProps {
  onFileSelect: (file: File) => void
  onError: (msg: string) => void
}

export function UploadStep({ onFileSelect, onError }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isDraggingRef = useRef(false)

  const handleFile = useCallback((file: File) => {
    if (!isValidImageType(file)) {
      onError('JPG, PNG, WEBP 파일만 올릴 수 있어요.')
      return
    }
    if (isFileTooSmall(file)) {
      onError('사진이 너무 작아요. 더 선명한 사진으로 시도해 주세요.')
      return
    }
    onFileSelect(file)
  }, [onFileSelect, onError])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    isDraggingRef.current = false
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className={`${styles.container} step-enter`}>
      <div className={styles.tagline}>
        <span className={styles.taglineEmoji}>🐾</span>
        <p>좋아하는 사람, 친구, 최애, 반려동물을<br />화면으로 귀엽게 복복복해 주세요.</p>
      </div>

      <div
        className={styles.uploadCard}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="사진 업로드"
      >
        <div className={styles.uploadIcon}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="var(--line)" strokeWidth="1.5"/>
            <path d="M18 10V26M10 18H26" stroke="var(--point)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className={styles.uploadLabel}>복복복해 줄 사진을 올려 주세요</p>
        <p className={styles.uploadSub}>JPG · PNG · WEBP</p>
      </div>

      <button
        className={`btn-primary ${styles.uploadBtn}`}
        onClick={() => inputRef.current?.click()}
      >
        사진 고르기
      </button>

      <p className={styles.privacyNote}>
        🔒 이미지는 기기 안에서만 처리돼요. 사진은 저장하지 않아요.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
      />
    </div>
  )
}
