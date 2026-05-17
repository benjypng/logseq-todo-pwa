export type Backend = 'cli' | 'http'

const STORAGE_KEY = 'logseq-pwa-backend'
const DEFAULT_BACKEND: Backend = 'cli'

export function getBackend(): Backend {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'http' || v === 'cli' ? v : DEFAULT_BACKEND
  } catch {
    return DEFAULT_BACKEND
  }
}

export function setBackend(b: Backend): void {
  try {
    localStorage.setItem(STORAGE_KEY, b)
  } catch {
    // ignore
  }
}
