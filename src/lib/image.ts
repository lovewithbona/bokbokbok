const MAX_DIMENSION = 1024

export async function resizeImageIfNeeded(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img

      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(file)
        return
      }

      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
      const newWidth = Math.round(width * ratio)
      const newHeight = Math.round(height * ratio)

      const canvas = document.createElement('canvas')
      canvas.width = newWidth
      canvas.height = newHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, newWidth, newHeight)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/png', 0.92)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }

    img.src = url
  })
}

export function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob)
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function createRoundedMask(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

export function isFileTooSmall(file: File): boolean {
  return file.size < 5000
}

export function isValidImageType(file: File): boolean {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
}
