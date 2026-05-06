import { useState, useCallback, useRef } from 'react'

interface ToastItem {
  id: number
  message: string
}

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const showToast = useCallback((message: string) => {
    const id = toastId++
    setToasts(prev => [...prev, { id, message }])

    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      timersRef.current.delete(id)
    }, 2500)
    timersRef.current.set(id, timer)
  }, [])

  return { toasts, showToast }
}

interface ToastContainerProps {
  toasts: ToastItem[]
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">{t.message}</div>
      ))}
    </div>
  )
}
