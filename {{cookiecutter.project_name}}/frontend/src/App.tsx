import { useEffect, useState } from 'react'

function App() {
  const [health, setHealth] = useState<{ status: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/healthz')
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: false }))
  }, [])

  return (
    <div>
      <h1>App</h1>
      <p>API status: {health === null ? 'loading...' : health.status ? 'ok' : 'error'}</p>
    </div>
  )
}

export default App
