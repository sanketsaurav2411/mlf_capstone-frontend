import { useState } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

const presets = [
  {
    name: 'Smartphones (HS 8517.12)',
    route: 'US [JFK] ──► IN [BOM]',
    usd: 899,
    fxRate: 86.5,
    bcdRate: 0.20,
    swsRate: 0.10,
    igstRate: 0.18,
    freight: 4500,
  },
  {
    name: 'Industrial Robotics (HS 8479.50)',
    route: 'DE [FRA] ──► IN [MAA]',
    usd: 12500,
    fxRate: 86.5,
    bcdRate: 0.075,
    swsRate: 0.10,
    igstRate: 0.18,
    freight: 28000,
  },
  {
    name: 'Biotech Reagents (HS 3822.00)',
    route: 'JP [HND] ──► IN [DEL]',
    usd: 2400,
    fxRate: 86.5,
    bcdRate: 0.10,
    swsRate: 0.10,
    igstRate: 0.12,
    freight: 8500,
  },
]

const features = [
  {
    index: '01 // TELEMETRY',
    title: 'Algorithmic Duty Forecasting',
    description:
      'Compute Basic Customs Duty, Social Welfare Surcharge, and integrated GST for cross-border shipments with calibrated HS code classification.',
  },
  {
    index: '02 // SCRUTINY',
    title: 'Statutory Notice Scrutiny',
    description:
      'Audit customs demand notices, Section 128 appeal deadlines, and valuation disparities with machine-assisted document parsing.',
  },
  {
    index: '03 // CONTINUITY',
    title: 'Stateful Contextual Memory',
    description:
      'Retain conversational context across multi-turn trade inquiries, volume variations, and input tax credit determinations.',
  },
]

function HomePage({ isLoggedIn }) {
  const [selectedPreset, setSelectedPreset] = useState(0)
  const current = presets[selectedPreset]

  // Scientific calculation
  const assessableValueInr = Math.round(current.usd * current.fxRate)
  const bcd = Math.round(assessableValueInr * current.bcdRate)
  const sws = Math.round(bcd * current.swsRate)
  const subtotalBeforeIgst = assessableValueInr + bcd + sws
  const igst = Math.round(subtotalBeforeIgst * current.igstRate)
  const totalLandedCost = assessableValueInr + bcd + sws + igst + current.freight

  return (
    <div className="page-shell">
      {/* Topbar: 1-Row, 3-Zone Contract */}
      <header className="topbar">
        {/* Zone 1: Single element brand mark */}
        <Link to="/" className="brand-wrap">
          <div className="brand-mark">TF</div>
          <div className="brand-text">
            <span className="brand-name">TariffFlow AI</span>
            <span className="brand-tag">Trade Telemetry & Customs Engine</span>
          </div>
        </Link>

        {/* Zone 2: Navigation Links */}
        <nav className="nav-links">
          <a href="#simulator" className="nav-link">Calibration</a>
          <a href="#capabilities" className="nav-link">Capabilities</a>
          <Link to="/request-demo" className="nav-link">Consultation</Link>
        </nav>

        {/* Zone 3: Primary Action + Theme Toggle */}
        <div className="nav-actions">
          <ThemeToggle />
          <Link to={isLoggedIn ? '/chat' : '/login'} className="primary-button small-button">
            {isLoggedIn ? 'Open Console' : 'Access System'}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero-section">
        <section className="hero-copy">
          <div className="eyebrow">
            <span>Precision Customs Architecture</span>
            <span aria-hidden="true">·</span>
            <span>HS 2026 Engine</span>
          </div>

          <h1>Empirical customs and tariff intelligence for global trade.</h1>

          <p>
            Evaluate import tariffs, verify HS classifications, assess Section 128 statutory notices, and calculate precise landed shipment costs before capital is deployed.
          </p>

          <div className="action-row">
            <Link to={isLoggedIn ? '/chat' : '/login'} className="primary-button">
              {isLoggedIn ? 'Launch Trade Console' : 'Initialize Workspace'}
            </Link>
            <Link to="/request-demo" className="secondary-button">
              Schedule Calibration
            </Link>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value tabular-nums">1.4s</span>
              <span className="stat-label">Classification Latency</span>
            </div>
            <div className="stat-card">
              <span className="stat-value tabular-nums">99.8%</span>
              <span className="stat-label">HS Mapping Accuracy</span>
            </div>
            <div className="stat-card">
              <span className="stat-value tabular-nums">24 / 7</span>
              <span className="stat-label">Active Port Telemetry</span>
            </div>
          </div>
        </section>

        {/* Scientific Simulation Console */}
        <aside id="simulator" className="scientific-panel">
          <div className="panel-top-hud">
            <div className="panel-title">
              <span>Interactive Calibrator</span>
              <span aria-hidden="true">·</span>
              <span>Live Assessment</span>
            </div>
            <div className="route-indicator">{current.route}</div>
          </div>

          {/* Preset Selector Tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {presets.map((preset, idx) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setSelectedPreset(idx)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedPreset === idx ? 'var(--accent-cyan)' : 'var(--border-hairline)',
                  background: selectedPreset === idx ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: selectedPreset === idx ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {preset.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="sim-query-box">
            <h3>{current.name}</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              Declared Value: US${current.usd.toLocaleString()} · Exchange Rate: ₹{current.fxRate}
            </div>
          </div>

          <div className="telemetry-grid">
            <div className="telemetry-cell">
              <div className="cell-label">Assessable Value (CIF)</div>
              <div className="cell-value">₹{assessableValueInr.toLocaleString()}</div>
            </div>
            <div className="telemetry-cell">
              <div className="cell-label">Basic Duty ({(current.bcdRate * 100).toFixed(1)}%)</div>
              <div className="cell-value">₹{bcd.toLocaleString()}</div>
            </div>
            <div className="telemetry-cell">
              <div className="cell-label">SWS (10% on BCD)</div>
              <div className="cell-value">₹{sws.toLocaleString()}</div>
            </div>
            <div className="telemetry-cell">
              <div className="cell-label">Integrated GST ({(current.igstRate * 100).toFixed(0)}%)</div>
              <div className="cell-value">₹{igst.toLocaleString()}</div>
            </div>
          </div>

          <div className="landed-cost-banner">
            <div>
              <div className="landed-cost-label">Total Landed Import Cost</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                Inclusive of freight, BCD, SWS & IGST
              </div>
            </div>
            <div className="landed-cost-value">₹{totalLandedCost.toLocaleString()}</div>
          </div>
        </aside>
      </main>

      {/* Capabilities Section */}
      <section id="capabilities" className="features-section">
        <div className="section-heading">
          <div className="eyebrow">Enterprise Capabilities</div>
          <h2>Engineered for algorithmic compliance & rapid trade clearing</h2>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-index">{feature.index}</div>
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
