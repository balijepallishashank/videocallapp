import React from 'react'

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel: string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ ariaLabel, className = '', children, ...rest }, ref) => {
    return (
      <button
        {...rest}
        ref={ref}
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${className}`}
      >
        {children}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

export default IconButton
