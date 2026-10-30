import { useState, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import RequestDemoPage from './pages/RequestDemoPage'
import './App.css'

const defaultUser = {
  id: 'user-2',
  name: 'Aarav Mehta',
  company: 'Export Logistics Pvt Ltd',
  email: 'business@tariff.ai',
}

function ProtectedRoute({ isLoggedIn, isLoading, children }) {
  if (isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: '#64748b' }}>
        Verifying session...
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('tariff_token') || '')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(defaultUser)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('tariff_token')
      if (!storedToken) {
        setIsLoadingAuth(false)
        return
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.user) {
            setUser(result.data.user)
            setIsLoggedIn(true)
            setToken(storedToken)
          } else {
            localStorage.removeItem('tariff_token')
            setToken('')
            setIsLoggedIn(false)
          }
        } else {
          localStorage.removeItem('tariff_token')
          setToken('')
          setIsLoggedIn(false)
        }
      } catch (err) {
        console.error('Failed to verify session:', err)
      } finally {
        setIsLoadingAuth(false)
      }
    }

    verifySession()
  }, [])

  const handleLogin = (authData) => {
    if (authData.token) {
      localStorage.setItem('tariff_token', authData.token)
      setToken(authData.token)
    }
    if (authData.user) {
      setUser(authData.user)
    }
    setIsLoggedIn(true)
  }

  const handleLogout = async () => {
    const currentToken = token || localStorage.getItem('tariff_token')
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        })
      } catch (err) {
        console.warn('Logout network error:', err)
      }
    }
    localStorage.removeItem('tariff_token')
    setToken('')
    setIsLoggedIn(false)
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} isLoggedIn={isLoggedIn} />} />
          <Route path="/request-demo" element={<RequestDemoPage token={token} />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoadingAuth}>
                <ChatPage user={user} token={token} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

