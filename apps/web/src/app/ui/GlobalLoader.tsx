/**
 * GlobalLoader
 * Fullscreen loader для начальной загрузки приложения
 */

function GlobalLoader() {
  return (
    <div className="global-loader">
      <div className="global-loader__content">
        <p className="global-loader__text">Загрузка…</p>
      </div>
    </div>
  )
}

export default GlobalLoader

const loaderStyles = `
.global-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-surface-base, #ffffff);
  z-index: 9999;
}

.global-loader__content {
  text-align: center;
}

.global-loader__text {
  font-size: var(--font-size-lg, 18px);
  color: var(--color-text-primary, #000000);
  margin: 0;
}
`

if (typeof document !== 'undefined') {
  const styleId = 'global-loader-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = loaderStyles
    document.head.appendChild(style)
  }
}

