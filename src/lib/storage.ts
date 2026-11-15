import { MAX_SOURCE_LENGTH } from './files'

export interface Draft {
  code: string
  title: string
  updatedAt: string
}

export const DRAFT_KEY = 'mermaid-studio:draft:v1'
export const BACKUP_KEY = 'mermaid-studio:backup:v1'

function isDraft(value: unknown): value is Draft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const draft = value as Record<string, unknown>
  return (
    typeof draft.code === 'string' &&
    draft.code.length <= MAX_SOURCE_LENGTH &&
    !draft.code.includes('\0') &&
    typeof draft.title === 'string' &&
    draft.title.length <= 200 &&
    typeof draft.updatedAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}T/.test(draft.updatedAt) &&
    Number.isFinite(Date.parse(draft.updatedAt))
  )
}

function readDraft(storage: Storage, key: string): Draft | null {
  const raw = storage.getItem(key)
  if (raw === null) return null
  const parsed: unknown = JSON.parse(raw)
  if (!isDraft(parsed)) throw new Error('草稿格式无效')
  return { code: parsed.code, title: parsed.title, updatedAt: parsed.updatedAt }
}

export function loadDraft(storage: Storage): { draft: Draft | null; warning?: string } {
  try {
    return { draft: readDraft(storage, DRAFT_KEY) }
  } catch {
    return {
      draft: null,
      warning: '无法恢复本地草稿，可能是存储不可用或草稿数据已损坏。请导入备份文件。',
    }
  }
}

function writeDraft(storage: Storage, key: string, draft: Draft): void {
  if (!isDraft(draft)) throw new Error('草稿格式无效，无法保存。')
  try {
    storage.setItem(
      key,
      JSON.stringify({ code: draft.code, title: draft.title, updatedAt: draft.updatedAt }),
    )
  } catch {
    throw new Error('本地保存失败，可能是浏览器限制或存储空间不足。请及时导出 .mmd 文件。')
  }
}

export function saveDraft(storage: Storage, draft: Draft): void {
  writeDraft(storage, DRAFT_KEY, draft)
}

export function backupDraft(storage: Storage, draft: Draft): void {
  writeDraft(storage, BACKUP_KEY, draft)
}

export function loadBackup(storage: Storage): Draft | null {
  try {
    return readDraft(storage, BACKUP_KEY)
  } catch {
    return null
  }
}
