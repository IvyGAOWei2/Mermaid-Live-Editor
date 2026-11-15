import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDiagram } from './useDiagram'
import { renderDiagram, type Diagram } from '../lib/render'

vi.mock('../lib/render', () => ({ renderDiagram: vi.fn() }))

function deferred() {
  let resolve!: (diagram: Diagram) => void
  let reject!: (error: Error) => void
  const promise = new Promise<Diagram>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function diagram(code: string): Diagram {
  return { code, svg: '<svg xmlns="http://www.w3.org/2000/svg"/>', width: 100, height: 100 }
}

describe('useDiagram', () => {
  let root: Root
  let container: HTMLDivElement
  let current: ReturnType<typeof useDiagram>
  const renderMock = vi.mocked(renderDiagram)

  function Harness({ code }: { code: string }) {
    current = useDiagram(code)
    return null
  }

  async function update(code: string) {
    await act(async () => {
      root.render(createElement(Harness, { code }))
    })
  }

  async function tick() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(280)
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    renderMock.mockReset()
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
    vi.useRealTimers()
  })

  it('prevents an older async result from replacing the latest input', async () => {
    const old = deferred()
    const latest = deferred()
    renderMock.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    await update('旧代码')
    await tick()
    await update('最新代码')
    await tick()

    await act(async () => {
      latest.resolve(diagram('最新代码'))
    })
    expect(current.diagram?.code).toBe('最新代码')
    await act(async () => {
      old.resolve(diagram('旧代码'))
    })
    expect(current.diagram?.code).toBe('最新代码')
    expect(current.error).toBe('')
    expect(current.busy).toBe(false)
  })

  it('retains the last successful diagram on error and clears the error after repair', async () => {
    renderMock.mockResolvedValueOnce(diagram('有效中文代码'))
    await update('有效中文代码')
    await tick()
    renderMock.mockRejectedValueOnce(new Error('第 3 行：缺少节点括号'))
    await update('错误代码')
    await tick()
    expect(current.diagram?.code).toBe('有效中文代码')
    expect(current.error).toContain('第 3 行')
    expect(current.busy).toBe(false)

    renderMock.mockResolvedValueOnce(diagram('修复后的代码'))
    await update('修复后的代码')
    await tick()
    expect(current.diagram?.code).toBe('修复后的代码')
    expect(current.error).toBe('')
    expect(current.busy).toBe(false)
  })

  it('debounces consecutive edits so only the final input is rendered', async () => {
    renderMock.mockResolvedValue(diagram('最终中文'))
    await update('最')
    await update('最终')
    await update('最终中文')
    await tick()
    expect(renderMock).toHaveBeenCalledExactlyOnceWith('最终中文')
    expect(current.diagram?.code).toBe('最终中文')
  })
})
