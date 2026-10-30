import { useState } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

const initialForm = {
  name: '',
  email: '',
  company: '',
  message: 'We require automated tariff estimation and statutory customs notice review for our cross-border operations.',
}

function RequestDemoPage({ token }) {
  const [formData, setFormData] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
      const activeToken = token || localStorage.getItem('tariff_token')
      const headers = {
        'Content-Type': 'application/json',
      }
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`
      }

      const response = await fetch('/api/request-demo', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.name.trim() || 'Trade Representative',
          email: formData.email.trim(),
          company: formData.company.trim() || undefined,
          message: formData.message.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        if (result.details && Array.isArray(result.details)) {
          const errorMsgs = result.details.map((d) => d.message).join(', ')
          setError(errorMsgs || result.message || 'Demo request failed')
        } else {
          setError(result.message || 'Could not submit demo request. Please try again.')
        }
        return
      }

      setSubmitted(true)
    } catch {
      setError('Unable to reach server. Please check your network connection.')
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
              <span className="brand-tag">Customs & Trade Intelligence</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        <h1>Request a Demo</h1>
        <p className="auth-subtitle">
          Schedule a personalized walkthrough of TariffFlow AI's customs duty engine and compliance tools.
        </p>

        {submitted ? (
          <div className="success-box">
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Request Submitted Successfully</div>
            <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
              Thank you! Our trade solutions team will contact you at <code>{formData.email}</code> within 24 hours.
            </div>
            <Link to="/login" className="primary-button" style={{ marginTop: '12px' }}>
              Proceed to Sign In
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <label>
              Full Name
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                required
              />
            </label>

            <label>
              Work Email Address
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jane@company.com"
                required
              />
            </label>

            <label>
              Company / Organization
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Global Freight Solutions Ltd"
              />
            </label>

            <label>
              Requirements & Scope
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="3"
                placeholder="Describe your product categories, trade lanes, or customs compliance goals..."
                required
              />
            </label>

            <button type="submit" className="primary-button" style={{ width: '100%' }} disabled={isLoading}>
              {isLoading ? 'Submitting Request...' : 'Submit Request'}
            </button>
          </form>
        )}

        <p className="login-footer">
          Return to <Link to="/">Home</Link>
        </p>
      </div>
    </div>
  )
}

export default RequestDemoPage
