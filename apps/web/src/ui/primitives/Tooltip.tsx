/**
 * Tooltip component
 * Hover/focus tooltip, positioned top
 * No portals (simple implementation)
 */

import React, { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'

interface TooltipProps {
  content: string | React.ReactNode
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      let top = 0
      let left = 0

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 12
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
          break
        case 'bottom':
          top = triggerRect.bottom + 8
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
          break
        case 'left':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
          left = triggerRect.left - tooltipRect.width - 8
          break
        case 'right':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
          left = triggerRect.right + 8
          break
      }

      setTooltipStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 2000,
      })
    }
  }, [isVisible, position])

  const handleMouseEnter = () => setIsVisible(true)
  const handleMouseLeave = () => setIsVisible(false)
  const handleFocus = () => setIsVisible(true)
  const handleBlur = () => setIsVisible(false)

  return (
    <>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={clsx('ui-tooltip', `ui-tooltip--${position}`)}
          style={tooltipStyle}
          role="tooltip"
        >
          {content}
        </div>
      )}
      {React.cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        'aria-describedby': isVisible ? 'tooltip' : undefined,
      })}
    </>
  )
}

export default Tooltip

const tooltipStyles = `
.ui-tooltip {
  padding: var(--spacing-8) var(--spacing-12);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-inverse);
  background-color: var(--color-neutral-110);
  border-radius: var(--radius-md);
  pointer-events: none;
  width: max-content;
  max-width: 300px;
  word-wrap: break-word;
  white-space: normal;
}

.ui-tooltip::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border: 6px solid transparent;
}

.ui-tooltip--top::before {
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: var(--color-neutral-110);
}

.ui-tooltip--bottom::before {
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-color: var(--color-neutral-110);
}

.ui-tooltip--left::before {
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  border-left-color: var(--color-neutral-110);
}

.ui-tooltip--right::before {
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  border-right-color: var(--color-neutral-110);
}
`

if (typeof document !== 'undefined') {
  const styleId = 'ui-tooltip-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = tooltipStyles
    document.head.appendChild(style)
  }
}

