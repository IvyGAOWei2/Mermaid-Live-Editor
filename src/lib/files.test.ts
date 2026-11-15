import { describe, expect, it, vi } from 'vitest'
import {
  MAX_SOURCE_LENGTH,
  downloadFile,
  normalizeSource,
  safeFilename,
  validateSourceFile,
} from './files'

describe('源文件校验和规范化', () => {
  it('接受大小边界和不区分大小写的文本扩展名', () => {
    for (const name of ['流程.MMD', 'demo.mermaid', 'demo.txt']) {
      expect(() => validateSourceFile({ name, size: 1024 * 1024 })).not.toThrow()
    }
  })

  it('拒绝不支持的文件和超过 1 MiB 的文件', () => {
    expect(() => validateSourceFile({ name: 'demo.svg', size: 20 })).toThrow(/请选择/)
    expect(() => validateSourceFile({ name: 'demo.mmd', size: 1024 * 1024 + 1 })).toThrow(/1 MB/)
    expect(() => validateSourceFile({ name: 'demo.mmd', size: NaN })).toThrow()
  })

  it('去掉 BOM 并规范化换行，保留中文和有效空格', () => {
    expect(normalizeSource('\uFEFFflowchart TD\r\n  A[中文] --> B\r')).toBe(
      'flowchart TD\n  A[中文] --> B\n',
    )
  })

  it('拒绝空白、二进制内容及字符上限之外的数据', () => {
    expect(() => normalizeSource(' \n\t')).toThrow(/为空/)
    expect(() => normalizeSource('flowchart TD\0')).toThrow(/二进制/)
    expect(() => normalizeSource('中'.repeat(MAX_SOURCE_LENGTH + 1))).toThrow(/100,000/)
    expect(normalizeSource('中'.repeat(MAX_SOURCE_LENGTH))).toHaveLength(MAX_SOURCE_LENGTH)
  })
})

describe('下载文件名', () => {
  it('保留中文并去除已存在的文件后缀', () => {
    expect(safeFilename('项目规划.mmd')).toBe('项目规划')
    expect(safeFilename('项目规划.svg')).toBe('项目规划')
  })

  it('替换路径和系统保留字符，处理保留名称与空名称', () => {
    expect(safeFilename('../测试/文件:1?.mmd')).toBe('..-测试-文件-1-')
    expect(safeFilename('CON')).toBe('我的图表')
    expect(safeFilename('NUL.txt')).toBe('我的图表')
    expect(safeFilename('...')).toBe('我的图表')
    expect(safeFilename('  ')).toBe('我的图表')
    expect(safeFilename('a'.repeat(100))).toHaveLength(80)
  })
})

describe('下载生命周期', () => {
  it('通过 Blob 发起下载并延迟回收对象 URL', () => {
    vi.useFakeTimers()
    const click = vi.fn()
    const remove = vi.fn()
    const anchor = { click, remove, href: '', download: '', hidden: false }
    const append = vi.fn()
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:test')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('document', { createElement: () => anchor, body: { append } })
    vi.stubGlobal('window', { setTimeout })
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    try {
      downloadFile('中文', 'text/plain;charset=utf-8', '我的图表.mmd')
      expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob)
      expect(anchor.download).toBe('我的图表.mmd')
      expect(anchor.href).toBe('blob:test')
      expect(append).toHaveBeenCalledWith(anchor)
      expect(click).toHaveBeenCalledOnce()
      expect(remove).toHaveBeenCalledOnce()
      expect(revokeObjectURL).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1000)
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
    } finally {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    }
  })
})
