import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

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
          setError(detailMessages || result.message || 'Login failed')
        } else {
          setError(result.message || 'Invalid email or password. Please try again.')
        }
        return
      }

      setError('')
      onLogin(result.data)
      navigate('/chat')
    } catch {
      setError('Unable to reach server. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand-row">
          <div className="brand-mark">T</div>
          <div>
            <div className="brand-name">TariffFlow AI</div>
            <div className="brand-tag">Business login</div>
          </div>
        </div>

        <h1>Welcome back</h1>
        <p className="auth-subtitle">Log in to check import duties and review trade documents.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <label>
            Email address
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
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
              <span>Keep me signed in</span>
            </label>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Secure JWT session</span>
          </div>

          <button type="submit" className="primary-button full-width" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Login to dashboard'}
          </button>
        </form>

        <div className="demo-box">
          <strong>Demo credentials</strong>
          <span>Email: <code>business@tariff.ai</code> | Password: <code>password123</code></span>
          <span>Email: <code>demo@example.com</code> | Password: <code>Demo@123</code></span>
        </div>

        <p className="login-footer">
          Need an account? <Link to="/">Go back home</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage

