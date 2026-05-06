export interface RecordingResult {
  blob: Blob
  mimeType: string
  extension: string
}

function getSupportedMimeType(): string {
  const types = [
    'video/mp4;codecs=h264',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return 'video/webm'
}

export async function recordCanvas(
  canvas: HTMLCanvasElement,
  durationMs: number,
  onProgress?: (progress: number) => void
): Promise<RecordingResult> {
  const mimeType = getSupportedMimeType()
  const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'

  const stream = canvas.captureStream(30)
  const chunks: BlobPart[] = []

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 4_000_000,
  })

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      resolve({ blob, mimeType, extension })
    }

    recorder.onerror = reject

    recorder.start(100)

    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      onProgress?.(progress)
      if (elapsed < durationMs) {
        requestAnimationFrame(tick)
      } else {
        recorder.stop()
        stream.getTracks().forEach(t => t.stop())
      }
    }
    requestAnimationFrame(tick)
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function canRecord(): boolean {
  return typeof MediaRecorder !== 'undefined'
}
