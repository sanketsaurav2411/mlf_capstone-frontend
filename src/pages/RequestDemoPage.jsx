import { useState } from 'react'
import { Link } from 'react-router-dom'

const initialForm = {
  name: '',
  email: '',
  mobile: '',
  company: '',
  message: 'We are interested in automated tariff estimation and customs review for our import operations.',
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
          setError(result.message || 'Could not submit demo request. Please check your entries.')
        }
        return
      }

      setSubmitted(true)
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
            <div className="brand-tag">Request a demo</div>
          </div>
        </div>

        <h1>Book a demo</h1>
        <p className="auth-subtitle">
          Tell us how to reach you and our team will contact you about the tariff intelligence system.
        </p>

        {submitted ? (
          <div className="demo-box success-box">
            <strong>Request submitted successfully</strong>
            <span>We will contact you shortly at {formData.email}.</span>
            <Link to="/login" className="primary-button full-width" style={{ marginTop: '12px' }}>
              Continue to Login
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <label>
              Full name
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
              Email address
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                required
              />
            </label>

            <label>
              Company name
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Your company name"
              />
            </label>

            <label>
              Requirement details
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="3"
                placeholder="Tell us about your import/export trade requirements..."
                required
              />
            </label>

            <button type="submit" className="primary-button full-width" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit request'}
            </button>
          </form>
        )}

        <p className="login-footer">
          <Link to="/">Back to home</Link>
        </p>
      </div>
    </div>
  )
}

export default RequestDemoPage

