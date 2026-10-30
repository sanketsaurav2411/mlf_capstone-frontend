import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/chat', { replace: true })
    }
  }, [isLoggedIn, navigate])

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
          setError(detailMessages || result.message || 'Authentication failed')
        } else {
          setError(result.message || 'Invalid credentials. Verification failed.')
        }
        return
      }

      setError('')
      onLogin(result.data)
      navigate('/chat')
    } catch {
      setError('Unable to reach telemetry server. Check connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header-row">
          <Link to="/" className="brand-wrap">
            <div className="brand-mark">TF</div>
            <div className="brand-text">
              <span className="brand-name">TariffFlow AI</span>
              <span className="brand-tag">Authentication Gate</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        <h1>Initialize Session</h1>
        <p className="auth-subtitle">Verify cryptographic credentials to access tariff telemetry and customs scrutiny console.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <label>
            Identifier (Email)
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="operator@company.com"
              required
              aria-invalid={Boolean(error)}
            />
          </label>

          <label>
            Security Key (Password)
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              aria-invalid={Boolean(error)}
            />
          </label>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" defaultChecked />
              <span>Persist Session Token</span>
            </label>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              JWT 256-bit
            </span>
          </div>

          <button type="submit" className="primary-button" style={{ width: '100%' }} disabled={isLoading}>
            {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter'}
          </button>
        </form>

        <div className="demo-credentials-box">
          <div style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>
            Preset Credentials
          </div>
          <div>Primary: <code>business@tariff.ai</code> / <code>password123</code></div>
          <div>Secondary: <code>demo@example.com</code> / <code>Demo@123</code></div>
        </div>

        <p className="login-footer">
          Return to <Link to="/">Telemetric Overview</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage

