import { useCallback, useState } from 'react'

const AUTH_KEY = 'auth-hash'
const expectedHash = import.meta.env.VITE_AUTH_HASH as string

async function hashString(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input)
  const buffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () =>
      localStorage.getItem(AUTH_KEY) === expectedHash && expectedHash !== '',
  )

  const login = useCallback(async (input: string): Promise<boolean> => {
    const hash = await hashString(input)
    if (hash === expectedHash) {
      localStorage.setItem(AUTH_KEY, hash)
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  return { isAuthenticated, login }
}
