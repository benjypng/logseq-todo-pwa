// iOS standalone PWA workaround:
// env(safe-area-inset-*) can be stale until WebKit recomputes them. Toggling
// viewport-fit forces recalculation without device rotation. Fires on cold
// start, after modal close, on visibilitychange, etc.
// Reference: https://gist.github.com/fozzedout/5e77925381991a9570151550992baf14

export const isIosStandalone = (): boolean => {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

export const nudgeViewport = (): void => {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
  if (!meta) return
  const original = meta.getAttribute('content') ?? ''
  if (!original.includes('viewport-fit=cover')) return
  meta.setAttribute(
    'content',
    original.replace('viewport-fit=cover', 'viewport-fit=auto'),
  )
  requestAnimationFrame(() => {
    meta.setAttribute('content', original)
  })
}

export const nudgeViewportStaggered = (): void => {
  nudgeViewport()
  setTimeout(nudgeViewport, 100)
  setTimeout(nudgeViewport, 500)
  setTimeout(nudgeViewport, 1000)
}
