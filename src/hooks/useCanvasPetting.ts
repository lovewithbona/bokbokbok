import { useRef, useEffect, useCallback, useState } from 'react'
import type { Particle, ReactionText, PettingState } from '../types'
import {
  createParticle,
  updateParticle,
  drawParticle,
  createReactionText,
  updateReactionText,
  drawReactionText,
} from '../lib/particles'

interface UseCanvasPettingOptions {
  imageBlob: Blob | null
  useFallbackMask: boolean
  canvasRef: React.RefObject<HTMLCanvasElement>
  onPettingStateChange?: (state: PettingState) => void
}

interface UseCanvasPettingReturn {
  pettingState: PettingState
  isAnimating: boolean
  startAutoAnimation: (durationMs: number) => void
  stopAutoAnimation: () => void
}

const PARTICLE_RATE = 2
const REACTION_TEXT_INTERVAL = 90

export function useCanvasPetting({
  imageBlob,
  useFallbackMask,
  canvasRef,
  onPettingStateChange,
}: UseCanvasPettingOptions): UseCanvasPettingReturn {
  const imageRef = useRef<HTMLImageElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const reactionTextsRef = useRef<ReactionText[]>([])
  const animFrameRef = useRef<number>(0)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)
  const isPettingRef = useRef(false)
  const strokeCountRef = useRef(0)
  const totalDistanceRef = useRef(0)
  const reactionTextTimerRef = useRef(0)
  const wobblerRef = useRef({ angle: 0, decay: 0 })
  const autoAnimRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAutoAnimRef = useRef(false)
  const frameCountRef = useRef(0)

  const [pettingState, setPettingState] = useState<PettingState>({
    isPetting: false,
    strokeCount: 0,
    totalDistance: 0,
    phase: 'idle',
  })
  const [isAnimating, setIsAnimating] = useState(false)

  // Load image when blob changes
  useEffect(() => {
    if (!imageBlob) return
    const img = new Image()
    img.onload = () => { imageRef.current = img }
    img.src = URL.createObjectURL(imageBlob)
    return () => { URL.revokeObjectURL(img.src) }
  }, [imageBlob])

  const getPhase = (strokeCount: number, distance: number): PettingState['phase'] => {
    if (strokeCount === 0 && distance < 50) return 'idle'
    if (distance < 300) return 'petting'
    if (strokeCount >= 5 || distance >= 600) return 'share'
    return 'happy'
  }

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    frameCountRef.current++

    const W = canvas.width
    const H = canvas.height

    // Clear
    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = '#FFF9F3'
    ctx.fillRect(0, 0, W, H)

    // Draw image
    const img = imageRef.current
    if (img) {
      const imgAspect = img.naturalWidth / img.naturalHeight
      const canvasAspect = W / H

      let drawW: number, drawH: number
      if (imgAspect > canvasAspect) {
        drawW = W * 0.85
        drawH = drawW / imgAspect
      } else {
        drawH = H * 0.72
        drawW = drawH * imgAspect
      }

      const drawX = (W - drawW) / 2
      const drawY = H * 0.06

      const wobble = wobblerRef.current
      const wobbleX = Math.sin(wobble.angle) * wobble.decay * 8
      const wobbleScaleY = 1 - Math.abs(Math.sin(wobble.angle * 2)) * wobble.decay * 0.025
      const wobbleScaleX = 1 + Math.abs(Math.sin(wobble.angle * 2)) * wobble.decay * 0.015

      // Shadow
      ctx.save()
      ctx.translate(drawX + drawW / 2 + wobbleX, drawY + drawH)
      ctx.scale(wobbleScaleX, 1)
      const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, drawW * 0.45)
      shadowGrad.addColorStop(0, 'rgba(42,37,35,0.12)')
      shadowGrad.addColorStop(1, 'rgba(42,37,35,0)')
      ctx.fillStyle = shadowGrad
      ctx.ellipse(0, 10, drawW * 0.42, 22, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Image
      ctx.save()
      ctx.translate(drawX + drawW / 2 + wobbleX, drawY + drawH / 2)
      ctx.scale(wobbleScaleX, wobbleScaleY)

      if (useFallbackMask) {
        // Rounded mask for fallback
        ctx.beginPath()
        const r = Math.min(drawW, drawH) * 0.08
        const hw = drawW / 2
        const hh = drawH / 2
        ctx.moveTo(-hw + r, -hh)
        ctx.lineTo(hw - r, -hh)
        ctx.quadraticCurveTo(hw, -hh, hw, -hh + r)
        ctx.lineTo(hw, hh - r)
        ctx.quadraticCurveTo(hw, hh, hw - r, hh)
        ctx.lineTo(-hw + r, hh)
        ctx.quadraticCurveTo(-hw, hh, -hw, hh - r)
        ctx.lineTo(-hw, -hh + r)
        ctx.quadraticCurveTo(-hw, -hh, -hw + r, -hh)
        ctx.closePath()
        ctx.clip()
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
      ctx.restore()

      // Update wobble decay
      if (wobble.decay > 0.001) {
        wobble.angle += 0.22
        wobble.decay *= 0.88
      } else {
        wobble.decay = 0
      }
    }

    // Update & draw particles
    particlesRef.current = particlesRef.current
      .map(updateParticle)
      .filter(p => p.life > 0)
    particlesRef.current.forEach(p => drawParticle(ctx, p))

    // Update & draw reaction texts
    reactionTextsRef.current = reactionTextsRef.current
      .map(updateReactionText)
      .filter(r => r.life > 0)
    reactionTextsRef.current.forEach(r => drawReactionText(ctx, r))

    // Auto-animation: simulate petting
    if (isAutoAnimRef.current) {
      const t = frameCountRef.current
      const cx = W * 0.5 + Math.sin(t * 0.15) * W * 0.2
      const cy = H * 0.25 + Math.sin(t * 0.1) * H * 0.05
      const speed = 4
      if (t % PARTICLE_RATE === 0) {
        for (let i = 0; i < 2; i++) {
          particlesRef.current.push(createParticle(cx, cy, speed * 30))
        }
      }
      if (t % REACTION_TEXT_INTERVAL === 0) {
        reactionTextsRef.current.push(createReactionText(W, H))
      }
      if (wobblerRef.current.decay < 0.1 && t % 40 === 0) {
        wobblerRef.current = { angle: 0, decay: 0.4 }
      }
    }

    animFrameRef.current = requestAnimationFrame(drawFrame)
  }, [canvasRef, useFallbackMask])

  // Start render loop when image is ready
  useEffect(() => {
    if (!imageBlob) return
    setIsAnimating(true)
    animFrameRef.current = requestAnimationFrame(drawFrame)
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      setIsAnimating(false)
    }
  }, [imageBlob, drawFrame])

  // Pointer handlers
  const handlePointerDown = useCallback((e: PointerEvent) => {
    e.preventDefault()
    isPettingRef.current = true
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    lastPointerRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [canvasRef])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isPettingRef.current) return
    e.preventDefault()
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const last = lastPointerRef.current

    if (last) {
      const dx = x - last.x
      const dy = y - last.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const speed = dist

      if (dist > 3) {
        totalDistanceRef.current += dist
        if (frameCountRef.current % PARTICLE_RATE === 0) {
          const count = speed > 20 ? 3 : 1
          for (let i = 0; i < count; i++) {
            particlesRef.current.push(createParticle(x, y, speed))
          }
        }

        reactionTextTimerRef.current++
        if (reactionTextTimerRef.current >= REACTION_TEXT_INTERVAL) {
          reactionTextTimerRef.current = 0
          reactionTextsRef.current.push(createReactionText(canvas.width, canvas.height))
          strokeCountRef.current++
        }

        // Trigger wobble on fast moves
        if (speed > 15 && wobblerRef.current.decay < 0.2) {
          wobblerRef.current = { angle: 0, decay: 0.5 }
        }

        const phase = getPhase(strokeCountRef.current, totalDistanceRef.current)
        const newState: PettingState = {
          isPetting: true,
          strokeCount: strokeCountRef.current,
          totalDistance: totalDistanceRef.current,
          phase,
        }
        setPettingState(newState)
        onPettingStateChange?.(newState)
      }
    }

    lastPointerRef.current = { x, y }
  }, [canvasRef, onPettingStateChange])

  const handlePointerUp = useCallback(() => {
    isPettingRef.current = false
    lastPointerRef.current = null
    const phase = getPhase(strokeCountRef.current, totalDistanceRef.current)
    const newState: PettingState = {
      isPetting: false,
      strokeCount: strokeCountRef.current,
      totalDistance: totalDistanceRef.current,
      phase,
    }
    setPettingState(newState)
    onPettingStateChange?.(newState)
  }, [onPettingStateChange])

  // Attach events
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageBlob) return

    canvas.addEventListener('pointerdown', handlePointerDown, { passive: false })
    canvas.addEventListener('pointermove', handlePointerMove, { passive: false })
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [imageBlob, handlePointerDown, handlePointerMove, handlePointerUp, canvasRef])

  const startAutoAnimation = useCallback((durationMs: number) => {
    isAutoAnimRef.current = true
    frameCountRef.current = 0
    autoAnimRef.current = setTimeout(() => {
      isAutoAnimRef.current = false
    }, durationMs)
  }, [])

  const stopAutoAnimation = useCallback(() => {
    isAutoAnimRef.current = false
    if (autoAnimRef.current) {
      clearTimeout(autoAnimRef.current)
    }
  }, [])

  return { pettingState, isAnimating, startAutoAnimation, stopAutoAnimation }
}
