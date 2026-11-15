import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
    return () => ref.current?.close()
  }, [])
  return (
    <dialog
      className={`modal ${wide ? 'modal-wide' : ''}`}
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="关闭窗口">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
