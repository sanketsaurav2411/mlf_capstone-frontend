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
    index: '01 // DUTY CALCULATION',
    title: 'Automated Landed Cost Calculation',
    description:
      'Compute Basic Customs Duty, Social Welfare Surcharge, and GST for cross-border shipments with up-to-date HS code classification.',
  },
  {
    index: '02 // DOCUMENT AUDIT',
    title: 'Customs Notice & Document Analysis',
    description:
      'Review customs demand notices, verify statutory timelines, and audit valuation discrepancies with smart document parsing.',
  },
  {
    index: '03 // CONVERSATION MEMORY',
    title: 'Multi-Turn Trade Inquiry Memory',
    description:
      'Retain full conversation context across multi-item shipments, volume adjustments, and input tax credit determinations.',
  },
]

function HomePage({ isLoggedIn }) {
  const [selectedPreset, setSelectedPreset] = useState(0)
  const current = presets[selectedPreset]

  // Real-world trade duty calculation
  const assessableValueInr = Math.round(current.usd * current.fxRate)
  const bcd = Math.round(assessableValueInr * current.bcdRate)
  const sws = Math.round(bcd * current.swsRate)
  const subtotalBeforeIgst = assessableValueInr + bcd + sws
  const igst = Math.round(subtotalBeforeIgst * current.igstRate)
  const totalLandedCost = assessableValueInr + bcd + sws + igst + current.freight

  return (
    <>
      {/* Frozen / Sticky Topbar */}
      <div className="topbar-wrapper">
        <header className="topbar-container">
          {/* Zone 1: Brand mark & title */}
          <Link to="/" className="brand-wrap">
            <div className="brand-mark">TF</div>
            <div className="brand-text">
              <span className="brand-name">TariffFlow AI</span>
              <span className="brand-tag">Customs & Trade Intelligence</span>
            </div>
          </Link>

          {/* Zone 2: Navigation Links */}
          <nav className="nav-links">
            <a href="#simulator" className="nav-link">Duty Calculator</a>
            <a href="#features" className="nav-link">Features</a>
            <Link to="/request-demo" className="nav-link">Request Demo</Link>
          </nav>

          {/* Zone 3: Primary Action + Theme Toggle */}
          <div className="nav-actions">
            <ThemeToggle />
            <Link to={isLoggedIn ? '/chat' : '/login'} className="primary-button small-button">
              {isLoggedIn ? 'Open Chat' : 'Sign In'}
            </Link>
          </div>
        </header>
      </div>

      <div className="page-shell">

      {/* Hero Section */}
      <main className="hero-section">
        <section className="hero-copy">
          <div className="eyebrow">
            <span>CUSTOMS DUTY & COMPLIANCE PLATFORM</span>
            <span aria-hidden="true">·</span>
            <span>HS 2026 SCHEDULE</span>
          </div>

          <h1>Instant customs duty calculation & trade intelligence.</h1>

          <p>
            Calculate landed import costs, verify Harmonized System (HS) classifications, and analyze customs notices with AI-assisted trade intelligence.
          </p>

          <div className="action-row">
            <Link to={isLoggedIn ? '/chat' : '/login'} className="primary-button">
              {isLoggedIn ? 'Launch Chat Assistant' : 'Try Free Assistant'}
            </Link>
            <Link to="/request-demo" className="secondary-button">
              Request a Demo
            </Link>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value tabular-nums">1.4s</span>
              <span className="stat-label">Average Response Time</span>
            </div>
            <div className="stat-card">
              <span className="stat-value tabular-nums">99.8%</span>
              <span className="stat-label">Tariff Rate Accuracy</span>
            </div>
            <div className="stat-card">
              <span className="stat-value tabular-nums">180+</span>
              <span className="stat-label">Trade Corridors</span>
            </div>
          </div>
        </section>

        {/* Live Duty Simulator Panel */}
        <aside id="simulator" className="scientific-panel">
          <div className="panel-top-hud">
            <div className="panel-title">
              <span>Duty Estimator</span>
              <span aria-hidden="true">·</span>
              <span>Live Breakdown</span>
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

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-heading">
          <div className="eyebrow">Core Capabilities</div>
          <h2>Engineered for accurate duty calculation & rapid customs clearance</h2>
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
    </>
  )
}

export default HomePage
