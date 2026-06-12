import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export default function AccessibleModal({ isOpen, onClose, title, children, className = '' }: AccessibleModalProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!rootRef.current) {
      rootRef.current = document.createElement('div')
      document.body.appendChild(rootRef.current)
      setRootElement(rootRef.current)
    }

    return () => {
      if (rootRef.current) {
        document.body.removeChild(rootRef.current)
        rootRef.current = null
        setRootElement(null)
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    previouslyFocused.current = document.activeElement as HTMLElement
    const focusable = rootElement?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    focusable?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        // basic focus trap
        const elements = rootRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!elements || elements.length === 0) return
        const first = elements[0]
        const last = elements[elements.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previouslyFocused.current?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen || !rootElement) return null

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-hidden={!isOpen}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        className={`relative z-10 max-w-3xl w-full ${className}`}
      >
        {children}
      </div>
    </div>
  )

  return createPortal(modal, rootElement)
}
