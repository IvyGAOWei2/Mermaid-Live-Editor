import { useCallback, useEffect, useRef, useState } from 'react'
import { Maximize, Minus, Plus, Scan, Move } from 'lucide-react'
import type { Diagram } from '../lib/render'

export function Preview({ diagram, busy }: { diagram: Diagram | null; busy: boolean }) {
  const viewport = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })
  const drag = useRef<{ id: number; x: number; y: number }>()
  const fit = useCallback(() => {
    const area = viewport.current
    if (area && diagram) {
      setTransform({
        scale: Math.max(
          0.05,
          Math.min(
            (area.clientWidth - 72) / diagram.width,
            (area.clientHeight - 90) / diagram.height,
            1.5,
          ),
        ),
        x: 0,
        y: 0,
      })
    }
  }, [diagram])
  useEffect(() => {
    fit()
    const observer = new ResizeObserver(fit)
    if (viewport.current) observer.observe(viewport.current)
    return () => observer.disconnect()
  }, [fit])

  const zoom = useCallback(
    (factor: number) =>
      setTransform((current) => ({
        ...current,
        scale: Math.max(0.05, Math.min(5, current.scale * factor)),
      })),
    [],
  )
  useEffect(() => {
    const area = viewport.current
    if (!area) return
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      zoom(event.deltaY < 0 ? 1.1 : 1 / 1.1)
    }
    area.addEventListener('wheel', wheel, { passive: false })
    return () => area.removeEventListener('wheel', wheel)
  }, [zoom])

  return (
    <div className="preview-body">
      <div
        ref={viewport}
        className="preview-viewport"
        tabIndex={0}
        role="region"
        aria-label="图形预览，可拖动平移、滚轮缩放"
        onKeyDown={(event) => {
          if (event.key === '+' || event.key === '=') zoom(1.2)
          else if (event.key === '-') zoom(1 / 1.2)
          else if (event.key === '0') fit()
          else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
            event.preventDefault()
            setTransform((t) => ({
              ...t,
              x: t.x + (event.key === 'ArrowLeft' ? -30 : event.key === 'ArrowRight' ? 30 : 0),
              y: t.y + (event.key === 'ArrowUp' ? -30 : event.key === 'ArrowDown' ? 30 : 0),
            }))
          }
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 || !diagram) return
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
        }}
        onPointerMove={(event) => {
          const last = drag.current
          if (!last || last.id !== event.pointerId) return
          const dx = event.clientX - last.x,
            dy = event.clientY - last.y
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
          setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
        }}
        onPointerUp={() => {
          drag.current = undefined
        }}
        onPointerCancel={() => {
          drag.current = undefined
        }}
      >
        {diagram ? (
          <div
            className="diagram-position"
            style={{ transform: `translate(${transform.x}px, ${transform.y}px)` }}
          >
            <div
              className="diagram-svg"
              style={{
                width: diagram.width,
                height: diagram.height,
                transform: `scale(${transform.scale}) translate(-50%, -50%)`,
              }}
              dangerouslySetInnerHTML={{ __html: diagram.svg }}
            />
          </div>
        ) : (
          <div className="preview-empty">
            <Scan size={34} />
            <p>{busy ? '正在准备你的图表…' : '从左侧代码开始，让想法成形'}</p>
          </div>
        )}
        {busy && diagram && (
          <div className="rendering-indicator">
            <span className="spinner" />
            正在更新
          </div>
        )}
      </div>
      <div className="preview-bottom">
        <span className="pan-hint">
          <Move size={13} />
          拖动平移 · 滚轮缩放
        </span>
        <div className="zoom-controls">
          <button
            className="icon-button"
            title="缩小"
            aria-label="缩小"
            onClick={() => zoom(1 / 1.2)}
          >
            <Minus size={16} />
          </button>
          <button
            className="zoom-value"
            title="恢复 100%"
            onClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
          >
            {Math.round(transform.scale * 100)}%
          </button>
          <button className="icon-button" title="放大" aria-label="放大" onClick={() => zoom(1.2)}>
            <Plus size={16} />
          </button>
          <span className="control-divider" />
          <button
            className="icon-button"
            title="适应窗口（预览区按 0）"
            aria-label="适应窗口"
            onClick={fit}
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
