import type { Particle, ReactionText } from '../types'

let particleId = 0
let reactionId = 0

const HEART_COLOR = ['#FF8FA3', '#FFB3C1', '#FF6B8A', '#FFADC5']
const STAR_COLOR = ['#FFD700', '#FFC947', '#FFE085', '#FFDB4D']
const CIRCLE_COLOR = ['#FFE3EA', '#FFC8D3', '#FFD5DE', '#FF8FA3']
const BOK_TEXTS = ['복', '복복', '복복복', '♡', '✦']

export function createParticle(x: number, y: number, speed: number): Particle {
  const types: Particle['type'][] = ['heart', 'star', 'circle', 'text']
  const weights = [0.35, 0.25, 0.25, 0.15]
  const rand = Math.random()
  let cumulative = 0
  let type: Particle['type'] = 'heart'
  for (let i = 0; i < types.length; i++) {
    cumulative += weights[i]
    if (rand < cumulative) { type = types[i]; break }
  }

  const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8
  const velocity = (0.8 + Math.random() * 0.8) * (1 + speed * 0.003)

  let color = ''
  if (type === 'heart') color = HEART_COLOR[Math.floor(Math.random() * HEART_COLOR.length)]
  else if (type === 'star') color = STAR_COLOR[Math.floor(Math.random() * STAR_COLOR.length)]
  else if (type === 'circle') color = CIRCLE_COLOR[Math.floor(Math.random() * CIRCLE_COLOR.length)]
  else color = '#FF8FA3'

  const maxLife = 40 + Math.random() * 30

  return {
    id: particleId++,
    x: x + (Math.random() - 0.5) * 30,
    y: y + (Math.random() - 0.5) * 20,
    vx: Math.cos(angle) * velocity * 0.5,
    vy: Math.sin(angle) * velocity,
    life: maxLife,
    maxLife,
    type,
    text: type === 'text' ? BOK_TEXTS[Math.floor(Math.random() * BOK_TEXTS.length)] : undefined,
    size: type === 'text' ? 14 + Math.random() * 10 : 8 + Math.random() * 12,
    color,
    opacity: 1,
  }
}

export function updateParticle(p: Particle): Particle {
  const lifeRatio = p.life / p.maxLife
  return {
    ...p,
    x: p.x + p.vx,
    y: p.y + p.vy,
    vy: p.vy - 0.06,
    vx: p.vx * 0.98,
    life: p.life - 1,
    opacity: lifeRatio < 0.3 ? lifeRatio / 0.3 : 1,
  }
}

export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save()
  ctx.globalAlpha = p.opacity

  if (p.type === 'heart') {
    drawHeart(ctx, p.x, p.y, p.size * 0.5, p.color)
  } else if (p.type === 'star') {
    drawStar(ctx, p.x, p.y, p.size * 0.4, p.color)
  } else if (p.type === 'circle') {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.fill()
  } else if (p.type === 'text' && p.text) {
    ctx.font = `${p.size}px 'Noto Sans KR', sans-serif`
    ctx.fillStyle = p.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(p.text, p.x, p.y)
  }

  ctx.restore()
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.beginPath()
  ctx.moveTo(0, size * 0.3)
  ctx.bezierCurveTo(-size * 1.5, -size * 0.8, -size * 2.5, size * 0.8, 0, size * 2)
  ctx.bezierCurveTo(size * 2.5, size * 0.8, size * 1.5, -size * 0.8, 0, size * 0.3)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 - Math.PI / 2
    const dist = i % 2 === 0 ? size : size * 0.4
    const px = Math.cos(angle) * dist
    const py = Math.sin(angle) * dist
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

export function createReactionText(canvasWidth: number, canvasHeight: number): ReactionText {
  const texts = ['복복복…', '좋아하는 중', '더 해 주세요', '말랑…', '기분 좋아', '복복♡', '최고야']
  const text = texts[Math.floor(Math.random() * texts.length)]
  const maxLife = 80

  return {
    id: reactionId++,
    text,
    x: canvasWidth * 0.5 + (Math.random() - 0.5) * canvasWidth * 0.4,
    y: canvasHeight * 0.25 + Math.random() * canvasHeight * 0.15,
    life: maxLife,
    maxLife,
    opacity: 0,
    scale: 0.7,
  }
}

export function updateReactionText(r: ReactionText): ReactionText {
  const lifeRatio = r.life / r.maxLife
  let opacity = 1
  let scale = 1

  if (lifeRatio > 0.85) {
    const t = (1 - lifeRatio) / 0.15
    opacity = t
    scale = 0.7 + t * 0.3
  } else if (lifeRatio < 0.25) {
    opacity = lifeRatio / 0.25
  }

  return {
    ...r,
    y: r.y - 0.3,
    life: r.life - 1,
    opacity,
    scale,
  }
}

export function drawReactionText(ctx: CanvasRenderingContext2D, r: ReactionText) {
  ctx.save()
  ctx.globalAlpha = r.opacity
  ctx.translate(r.x, r.y)
  ctx.scale(r.scale, r.scale)
  ctx.font = `500 15px 'Noto Sans KR', sans-serif`
  ctx.fillStyle = '#FF8FA3'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Soft shadow
  ctx.shadowColor = 'rgba(255,143,163,0.4)'
  ctx.shadowBlur = 8
  ctx.fillText(r.text, 0, 0)
  ctx.restore()
}
