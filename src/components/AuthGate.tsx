import { type ReactNode, useState } from 'react'

import { useAuth } from '../hooks/use-auth'
import { Button } from './ui/button'

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, login } = useAuth()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <>{children}</>

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const success = await login(input)
    setLoading(false)
    if (!success) {
      setError('Incorrect password')
      setInput('')
    }
  }

  return (
    <div className="flex h-screen items-center justify-center px-6">
      <div className="flex w-full max-w-xs flex-col gap-3">
        <label
          htmlFor="auth-password"
          className="text-sm font-medium text-foreground"
        >
          Password
        </label>
        <input
          id="auth-password"
          type="password"
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
          disabled={loading}
          className="w-full rounded-xl border-none bg-secondary px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Checking…' : 'Login'}
        </Button>
      </div>
    </div>
  )
}
