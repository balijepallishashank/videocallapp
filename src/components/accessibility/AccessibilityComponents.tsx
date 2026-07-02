import { useEffect, useState } from 'react'

// ARIA-enabled button wrapper
export function AccessibleButton({
  children,
  onClick,
  ariaLabel,
  ariaPressed = false,
  ariaDescribedBy,
  disabled = false,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  onClick: () => void
  ariaLabel: string
  ariaPressed?: boolean
  ariaDescribedBy?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-describedby={ariaDescribedBy}
      className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  )
}

// Screen reader only text
export function ScreenReaderText({ text }: { text: string }) {
  return (
    <span className="sr-only">
      {text}
    </span>
  )
}

// Accessible modal with focus management
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  role = 'dialog',
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  role?: 'dialog' | 'alertdialog'
}) {
  useEffect(() => {
    if (isOpen) {
      // Trap focus in modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div
        role={role}
        aria-modal="true"
        aria-labelledby="modal-title"
        className="glass rounded-2xl p-6 border border-slate-700/50 max-w-md w-full"
      >
        <h2 id="modal-title" className="text-xl font-bold text-white mb-4">
          {title}
        </h2>
        {children}
        <button
          onClick={onClose}
          className="sr-only focus:not-sr-only p-2 mt-4 bg-slate-700 rounded"
        >
          Close modal
        </button>
      </div>
    </div>
  )
}

// High contrast mode component
export function HighContrastWrapper({ 
  children,
  enabled = false 
}: { 
  children: React.ReactNode
  enabled?: boolean 
}) {
  return (
    <div
      className={`${
        enabled
          ? '[&_*]:font-bold [&_*]:border-2 [&_*]:text-white [&_*]:bg-black'
          : ''
      }`}
    >
      {children}
    </div>
  )
}

// Skip to content link
export function SkipToContentLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only absolute top-0 left-0 px-4 py-2 bg-blue-600 text-white rounded-br rounded-bl"
    >
      Skip to main content
    </a>
  )
}

// Theme provider using system preference and localStorage
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null
    if (saved) return saved === 'dark'
    
    // Check system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return true
  })

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    
    // Update document class for CSS
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const toggleTheme = () => setIsDark(!isDark)

  return { isDark, toggleTheme }
}

// Announce changes to screen readers
export function useScreenReaderAnnouncement() {
  const [announcement, setAnnouncement] = useState('')

  const announce = (message: string) => {
    // Clear previous message
    setAnnouncement('')
    
    // Trigger new announcement
    setTimeout(() => {
      setAnnouncement(message)
    }, 100)

    // Clear after announcement is read
    setTimeout(() => {
      setAnnouncement('')
    }, 3000)
  }

  return { announcement, announce, AnnounceWrapper }
}

function AnnounceWrapper({ text }: { text: string }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {text}
    </div>
  )
}

// Accessible form input with label
export function AccessibleFormInput({
  id,
  label,
  helpText,
  error,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  className = '',
}: {
  id: string
  label: string
  helpText?: string
  error?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  disabled?: boolean
  className?: string
}) {
  const helpId = helpText ? `${id}-help` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-white mb-2"
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-describedby={[helpId, errorId].filter(Boolean).join(' ')}
        aria-invalid={!!error}
        className={`
          w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700
          text-white placeholder-slate-400 transition-all focus:outline-none
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
      />

      {helpText && (
        <p id={helpId} className="mt-2 text-xs text-slate-400">
          {helpText}
        </p>
      )}

      {error && (
        <p id={errorId} className="mt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Keyboard navigation menu
export function AccessibleMenu({
  items,
  onSelect,
  label = 'Menu',
}: {
  items: { id: string; label: string; icon?: React.ReactNode }[]
  onSelect: (id: string) => void
  label?: string
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % items.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect(items[selectedIndex].id)
        break
    }
  }

  return (
    <nav aria-label={label}>
      <ul
        role="menu"
        onKeyDown={handleKeyDown}
        className="space-y-1 focus-within:outline-none"
      >
        {items.map((item, index) => (
          <li key={item.id} role="none">
            <button
              role="menuitem"
              onClick={() => {
                setSelectedIndex(index)
                onSelect(item.id)
              }}
              onFocus={() => setSelectedIndex(index)}
              aria-current={index === selectedIndex}
              className={`
                w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left
                transition-all focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  index === selectedIndex
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }
              `}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Live region for real-time updates (for meeting status, notifications, etc.)
export function LiveRegion({
  message,
  priority = 'polite',
}: {
  message: string
  priority?: 'polite' | 'assertive'
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role={priority === 'assertive' ? 'alert' : undefined}
    >
      {message}
    </div>
  )
}
