import { Button, Center, PasswordInput, Stack } from '@mantine/core'
import { type ReactNode, useState } from 'react'

import { useAuth } from '../hooks/use-auth'

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
    <Center h="100vh">
      <Stack w={300}>
        <PasswordInput
          label="Password"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
          error={error}
          autoFocus
        />
        <Button onClick={handleSubmit} loading={loading}>
          Login
        </Button>
      </Stack>
    </Center>
  )
}
