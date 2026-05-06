import styles from './Header.module.css'

interface HeaderProps {
  showBack?: boolean
  onBack?: () => void
}

export function Header({ showBack, onBack }: HeaderProps) {
  return (
    <header className={styles.header}>
      {showBack && (
        <button className={styles.backBtn} onClick={onBack} aria-label="뒤로">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      <h1 className={styles.logo}>복복복~</h1>
    </header>
  )
}
