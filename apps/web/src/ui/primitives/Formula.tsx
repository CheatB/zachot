/**
 * Formula component
 * Renders LaTeX formulas using KaTeX
 */

import katex from 'katex'
import { useEffect, useRef } from 'react'

interface FormulaProps {
  tex: string
  block?: boolean
}

function Formula({ tex, block = false }: FormulaProps) {
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(tex, containerRef.current, {
          throwOnError: false,
          displayMode: block,
        })
      } catch (error) {
        console.error('KaTeX rendering error:', error)
      }
    }
  }, [tex, block])

  return <span ref={containerRef} className="ui-formula" />
}

export default Formula



