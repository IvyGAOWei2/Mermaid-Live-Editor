import { useEffect, useState } from 'react'
import { renderDiagram, type Diagram } from '../lib/render'

export function useDiagram(code: string) {
  const [diagram, setDiagram] = useState<Diagram | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  useEffect(() => {
    let cancelled = false
    setBusy(true)
    const timer = window.setTimeout(async () => {
      try {
        const next = await renderDiagram(code)
        if (!cancelled) {
          setDiagram(next)
          setError('')
        }
      } catch (cause) {
        if (!cancelled) {
          const detail = cause instanceof Error ? cause.message : String(cause)
          setError(detail.slice(0, 1200))
        }
      } finally {
        if (!cancelled) setBusy(false)
      }
    }, 280)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [code])
  return { diagram, error, busy }
}
