export type AppStep = 'upload' | 'loading' | 'petting' | 'share'

export interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  type: 'heart' | 'star' | 'circle' | 'text'
  text?: string
  size: number
  color: string
  opacity: number
}

export interface PettingState {
  isPetting: boolean
  strokeCount: number
  totalDistance: number
  phase: 'idle' | 'petting' | 'happy' | 'share'
}

export interface ReactionText {
  id: number
  text: string
  x: number
  y: number
  life: number
  maxLife: number
  opacity: number
  scale: number
}

export interface ShareOptions {
  title: string
  text: string
  url: string
  file?: File
}
