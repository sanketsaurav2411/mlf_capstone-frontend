import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Duty Forecasting',
    description:
      'Ask about tariff, GST, and customs charges for cross-border imports in plain language.',
  },
  {
    title: 'Customs Review',
    description:
      'Upload customs notices and supporting documents to understand the financial impact quickly.',
  },
  {
    title: 'Business Ready',
    description:
      'Built for import managers, exporters, and trade decision-makers who need fast answers.',
  },
]

function HomePage({ isLoggedIn }) {
  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">T</div>
          <div>
            <div className="brand-name">TariffFlow AI</div>
            <div className="brand-tag">Trade intelligence for business</div>
          </div>
        </div>

        <nav className="nav-actions">
          <Link to={isLoggedIn ? "/chat" : "/login"} className="primary-button small-button">
            {isLoggedIn ? "Open Chat" : "Login to Chat"}
          </Link>
        </nav>
      </header>

      <main className="hero-section">
        <section className="hero-copy">
          <span className="eyebrow">Smart tariff guidance</span>
          <h1>Understand import costs before every shipment.</h1>
          <p>
            TariffFlow AI helps businessmen ask trade and customs questions quickly, review
            notice documents, and understand tax exposure without confusion.
          </p>

          <div className="action-row">
            <Link to={isLoggedIn ? "/chat" : "/login"} className="primary-button">
              {isLoggedIn ? "Open Chat Dashboard" : "Login to Chat"}
            </Link>
            <Link to="/request-demo" className="secondary-button">
              Request Demo
            </Link>
          </div>

          <div className="stats-row">
            <div>
              <strong>1.2k+</strong>
              <span>trade queries handled</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>customs support</span>
            </div>
            <div>
              <strong>4 min</strong>
              <span>average answer time</span>
            </div>
          </div>
        </section>

        <aside className="hero-panel">
          <div className="panel-card">
            <div className="card-header">
              <span className="status-dot" />
              Live Query Example
            </div>
            <h3>“What is the tariff for shipping a 256GB iPhone 15 from the US to India?”</h3>
            <div className="response-box">
              <p>
                Estimated landed cost: <strong>₹85,430</strong> total, including customs duty
                <strong> ₹24,180</strong>, GST <strong>₹13,420</strong>, and logistics handling
                <strong> ₹7,830</strong>, based on declared value of <strong>US$899</strong> and
                HS code <strong>8517.12</strong>.
              </p>
            </div>
            <ul className="mini-list">
              <li>HS code: 8517.12</li>
              <li>Import duty estimate: 20%</li>
              <li>GST applied: 18%</li>
            </ul>
          </div>
        </aside>
      </main>

      <section className="features-section">
        <div className="section-heading">
          <span className="eyebrow">Why businesses choose us</span>
          <h2>Built for faster trade decisions</h2>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-icon">✓</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
