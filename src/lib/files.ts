export const MAX_SOURCE_LENGTH = 100_000
const MAX_FILE_SIZE = 1024 * 1024

export function validateSourceFile(file: Pick<File, 'name' | 'size'>): void {
  if (!/\.(mmd|mermaid|txt)$/i.test(file.name)) {
    throw new Error('请选择 .mmd、.mermaid 或 .txt 源文件。')
  }
  if (!Number.isFinite(file.size) || file.size < 0 || file.size > MAX_FILE_SIZE) {
    throw new Error('源文件大小不能超过 1 MB。')
  }
}

export function normalizeSource(source: string): string {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  if (normalized.length > MAX_SOURCE_LENGTH) {
    throw new Error('源代码不能超过 100,000 个字符。')
  }
  if (!normalized.trim()) {
    throw new Error('源文件为空，请选择包含 Mermaid 代码的文件。')
  }
  if (normalized.includes('\0')) {
    throw new Error('源文件包含不支持的二进制内容，请使用 UTF-8 文本文件。')
  }
  return normalized
}

export function safeFilename(title: string): string {
  const sanitized = title
    .replace(/[<>:"/\\|?*\u0000-\u001F\u007F]/g, '-')
    .replace(/\.(mmd|mermaid|txt|svg)$/i, '')
    .replace(/[. ]+$/g, '')
    .trim()
    .slice(0, 80)
    .replace(/[. ]+$/g, '')
  if (!sanitized || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(sanitized)) {
    return '我的图表'
  }
  return sanitized
}

export function downloadFile(content: string, type: string, filename: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.hidden = true
  document.body.append(anchor)
  try {
    anchor.click()
  } finally {
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
  }
}
