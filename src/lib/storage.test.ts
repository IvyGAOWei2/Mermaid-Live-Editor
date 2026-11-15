import { describe, expect, it } from 'vitest'
import {
  BACKUP_KEY,
  DRAFT_KEY,
  backupDraft,
  loadBackup,
  loadDraft,
  saveDraft,
  type Draft,
} from './storage'

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key)
    },
    setItem: (key, value) => {
      data.set(key, value)
    },
  }
}

const draft: Draft = {
  code: 'flowchart TD\n  A[中文] --> B[结果]',
  title: '我的流程',
  updatedAt: '2026-11-15T08:00:00.000Z',
}

describe('本地草稿', () => {
  it('首次访问没有草稿，中文代码与标题可往返', () => {
    const storage = memoryStorage()
    expect(loadDraft(storage)).toEqual({ draft: null })
    saveDraft(storage, draft)
    expect(loadDraft(storage)).toEqual({ draft })
  })

  it('空编辑器仍然可保存，恢复使用最近一次写入', () => {
    const storage = memoryStorage()
    saveDraft(storage, draft)
    saveDraft(storage, { ...draft, code: '' })
    expect(loadDraft(storage).draft?.code).toBe('')
  })

  it.each([
    '{broken',
    'null',
    '[]',
    '{}',
    JSON.stringify({ ...draft, code: 1 }),
    JSON.stringify({ ...draft, title: 'x'.repeat(201) }),
    JSON.stringify({ ...draft, updatedAt: 'yesterday' }),
    JSON.stringify({ ...draft, code: 'x'.repeat(100001) }),
  ])('损坏或无效草稿返回警告', (raw) => {
    const storage = memoryStorage()
    storage.setItem(DRAFT_KEY, raw)
    expect(loadDraft(storage)).toEqual({
      draft: null,
      warning: expect.stringContaining('无法恢复'),
    })
    expect(storage.getItem(DRAFT_KEY)).toBe(raw)
  })

  it('读取被拒绝不抛错，写入被拒绝给出可操作说明', () => {
    const storage = memoryStorage()
    storage.getItem = () => {
      throw new Error('blocked')
    }
    storage.setItem = () => {
      throw new Error('quota')
    }
    expect(loadDraft(storage).warning).toContain('存储不可用')
    expect(() => saveDraft(storage, draft)).toThrow(/导出 \.mmd/)
    expect(loadBackup(storage)).toBeNull()
  })

  it('拒绝保存无效数据并保留已有草稿', () => {
    const storage = memoryStorage()
    saveDraft(storage, draft)
    expect(() => saveDraft(storage, { ...draft, code: 'x'.repeat(100001) })).toThrow(/格式无效/)
    expect(loadDraft(storage).draft).toEqual(draft)
  })
})

describe('覆盖前备份', () => {
  it('备份和当前草稿分开保存，最新备份替换前一份', () => {
    const storage = memoryStorage()
    saveDraft(storage, draft)
    backupDraft(storage, draft)
    const newer = { ...draft, title: '备份二' }
    backupDraft(storage, newer)
    expect(loadDraft(storage).draft).toEqual(draft)
    expect(loadBackup(storage)).toEqual(newer)
    expect(storage.getItem(BACKUP_KEY)).not.toBeNull()
  })

  it('无效备份不会导致页面异常', () => {
    const storage = memoryStorage()
    storage.setItem(BACKUP_KEY, 'broken')
    expect(loadBackup(storage)).toBeNull()
  })
})
