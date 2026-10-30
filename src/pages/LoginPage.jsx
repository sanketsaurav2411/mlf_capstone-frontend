import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

function LoginPage({ onLogin, isLoggedIn }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: 'business@tariff.ai',
    password: 'password123',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showGooglePrompt, setShowGooglePrompt] = useState(false)
  const [googleEmailInput, setGoogleEmailInput] = useState('shadowspace24@gmail.com')

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/chat', { replace: true })
    }
  }, [isLoggedIn, navigate])

  const handleGoogleSuccess = useCallback(async (googlePayload) => {
    setIsGoogleLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googlePayload),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.message || 'Google sign-in could not be completed.')
        return
      }

      setError('')
      onLogin(result.data)
      navigate('/chat')
    } catch {
      setError('Unable to reach authentication server. Please check your connection.')
    } finally {
      setIsGoogleLoading(false)
    }
  }, [navigate, onLogin])

  // Optional Google Identity Services (GIS) integration if client ID is defined in environment
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              handleGoogleSuccess({ credential: response.credential })
            }
          },
        })
      } catch (err) {
        console.warn('GIS initialization notice:', err)
      }
    }
  }, [handleGoogleSuccess])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))

    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        if (result.details && Array.isArray(result.details)) {
          const detailMessages = result.details.map((d) => d.message).join(', ')
          setError(detailMessages || result.message || 'Sign in failed')
        } else {
          setError(result.message || 'Invalid email or password. Please try again.')
        }
        return
      }

      setError('')
      onLogin(result.data)
      navigate('/chat')
    } catch {
      setError('Unable to reach server. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleBtnClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt()
        return
      } catch {
        // Fall back to direct modal selection
      }
    }
    setShowGooglePrompt(true)
  }

  const handleQuickGoogleSubmit = (e) => {
    e?.preventDefault?.()
    if (!googleEmailInput.trim()) return
    const namePart = googleEmailInput.split('@')[0].replace(/[._-]/g, ' ')
    const formattedName = namePart
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    handleGoogleSuccess({
      email: googleEmailInput.trim(),
      name: formattedName || 'Google User',
    })
  }

  const fillCredentials = (email, password) => {
    setFormData({ email, password })
    setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header-row">
          <Link to="/" className="brand-wrap">
            <div className="brand-mark">TF</div>
            <div className="brand-text">
              <span className="brand-name">TariffFlow AI</span>
              <span className="brand-tag">Customs & Trade Intelligence</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        <h1>Welcome Back</h1>
        <p className="auth-subtitle">
          Sign in to access your saved duty estimates, HS code classifications, and customs assistant.
        </p>

        {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}

        {/* Google Sign-In Button */}
        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleBtnClick}
          disabled={isGoogleLoading || isLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        {/* Quick Google Account Selection Card if clicked */}
        {showGooglePrompt && (
          <div className="google-prompt-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Choose Google Account</span>
              <button
                type="button"
                onClick={() => setShowGooglePrompt(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div
              className="google-account-pill"
              onClick={() => {
                handleGoogleSuccess({
                  email: 'shadowspace24@gmail.com',
                  name: 'Shadow Space',
                })
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>shadowspace24@gmail.com</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Connected Google Profile</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#4285f4', fontWeight: 600 }}>Sign in ➔</span>
            </div>

            <form onSubmit={handleQuickGoogleSubmit} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <input
                type="email"
                value={googleEmailInput}
                onChange={(e) => setGoogleEmailInput(e.target.value)}
                placeholder="other.account@gmail.com"
                style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-hairline)', background: 'var(--bg-canvas)', color: 'var(--text-primary)' }}
                required
              />
              <button
                type="submit"
                className="primary-button small-button"
                disabled={isGoogleLoading}
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                Sign In
              </button>
            </form>
          </div>
        )}

        <div className="auth-divider">or sign in with email</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email Address
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              required
              aria-invalid={Boolean(error)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              aria-invalid={Boolean(error)}
            />
          </label>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" defaultChecked />
              <span>Remember me</span>
            </label>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              TLS Encrypted
            </span>
          </div>

          <button type="submit" className="primary-button" style={{ width: '100%' }} disabled={isLoading || isGoogleLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-credentials-box">
          <div style={{ fontWeight: 700, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>
            Quick Demo Logins (Click to fill)
          </div>
          <div className="demo-presets-row">
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => fillCredentials('business@tariff.ai', 'password123')}
            >
              business@tariff.ai
            </button>
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => fillCredentials('demo@example.com', 'Demo@123')}
            >
              demo@example.com
            </button>
          </div>
        </div>

        <p className="login-footer">
          Return to <Link to="/">Home</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
