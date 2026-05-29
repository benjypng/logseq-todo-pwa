import { useCallback, useState } from 'react'

const expectedHash = import.meta.env.VITE_AUTH_HASH as string
const STORAGE_KEY = 'auth-hash'

async function hashString(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input)
  const buffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hasValidStoredHash(): boolean {
  if (expectedHash === '') return false
  return localStorage.getItem(STORAGE_KEY) === expectedHash
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasValidStoredHash)

  const login = useCallback(async (input: string): Promise<boolean> => {
    const hash = await hashString(input)
    if (hash === expectedHash && expectedHash !== '') {
      localStorage.setItem(STORAGE_KEY, hash)
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  return { isAuthenticated, login }
}
