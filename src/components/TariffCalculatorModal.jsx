import { useState } from 'react'

export default function TariffCalculatorModal({ isOpen, onClose, onInsertPrompt }) {
  const [productName, setProductName] = useState('Electronic Component / Device')
  const [currency, setCurrency] = useState('USD')
  const [amount, setAmount] = useState(1000)
  const [fxRate, setFxRate] = useState(86.5)
  const [bcdRate, setBcdRate] = useState(10) // percent
  const [swsRate] = useState(10) // percent of BCD
  const [igstRate, setIgstRate] = useState(18) // percent
  const [freight, setFreight] = useState(3500)

  if (!isOpen) return null

  const assessableValueInr = Math.round(amount * fxRate)
  const bcdAmount = Math.round(assessableValueInr * (bcdRate / 100))
  const swsAmount = Math.round(bcdAmount * (swsRate / 100))
  const subtotalBeforeIgst = assessableValueInr + bcdAmount + swsAmount
  const igstAmount = Math.round(subtotalBeforeIgst * (igstRate / 100))
  const totalLandedCost = assessableValueInr + bcdAmount + swsAmount + igstAmount + Number(freight || 0)
  const effectiveDutyPct = assessableValueInr > 0 ? (((totalLandedCost - assessableValueInr - Number(freight || 0)) / assessableValueInr) * 100).toFixed(1) : 0

  const handleInsert = () => {
    const promptText = `Please verify the tariff assessment for ${productName}: Declared value ${currency} ${amount.toLocaleString()} (approx ₹${assessableValueInr.toLocaleString()} CIF). With BCD ${bcdRate}% (₹${bcdAmount.toLocaleString()}), SWS ${swsRate}% (₹${swsAmount.toLocaleString()}), and IGST ${igstRate}% (₹${igstAmount.toLocaleString()}), estimated landed cost is ₹${totalLandedCost.toLocaleString()}. Are there any exemptions or recent notifications applicable?`
    onInsertPrompt(promptText)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="empty-state-badge">Duty Calculator</span>
            <h3>Landed Cost & Tariff Estimator</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="calc-inputs-grid">
            <label>
              <span>Product Description</span>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product name / HS Heading"
              />
            </label>

            <div className="calc-flex-row">
              <label style={{ flex: 1 }}>
                <span>Currency</span>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CNY">CNY (¥)</option>
                </select>
              </label>

              <label style={{ flex: 2 }}>
                <span>Invoice Value</span>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                />
              </label>

              <label style={{ flex: 1 }}>
                <span>FX Rate (₹)</span>
                <input
                  type="number"
                  step="0.1"
                  value={fxRate}
                  onChange={(e) => setFxRate(Number(e.target.value) || 0)}
                />
              </label>
            </div>

            <div className="calc-flex-row">
              <label style={{ flex: 1 }}>
                <span>BCD Rate (%)</span>
                <select value={bcdRate} onChange={(e) => setBcdRate(Number(e.target.value))}>
                  <option value={0}>0% (Exempt / ITA-1)</option>
                  <option value={7.5}>7.5% (Machinery / Capital)</option>
                  <option value={10}>10.0% (Standard Industrial)</option>
                  <option value={15}>15.0% (Consumer)</option>
                  <option value={20}>20.0% (Smartphones / Luxury)</option>
                </select>
              </label>

              <label style={{ flex: 1 }}>
                <span>IGST Rate (%)</span>
                <select value={igstRate} onChange={(e) => setIgstRate(Number(e.target.value))}>
                  <option value={5}>5% (Essential)</option>
                  <option value={12}>12% (Standard Concessional)</option>
                  <option value={18}>18% (Standard Commercial)</option>
                  <option value={28}>28% (Automotive / Demerit)</option>
                </select>
              </label>

              <label style={{ flex: 1 }}>
                <span>Freight / Logistics (₹)</span>
                <input
                  type="number"
                  value={freight}
                  onChange={(e) => setFreight(Number(e.target.value) || 0)}
                />
              </label>
            </div>
          </div>

          {/* Computed Breakdown Table */}
          <div className="calc-results-box">
            <div className="results-row">
              <span>Assessable Value (CIF):</span>
              <strong className="font-mono">₹{assessableValueInr.toLocaleString()}</strong>
            </div>
            <div className="results-row">
              <span>Basic Customs Duty ({bcdRate}%):</span>
              <strong className="font-mono">₹{bcdAmount.toLocaleString()}</strong>
            </div>
            <div className="results-row">
              <span>Social Welfare Surcharge (10% of BCD):</span>
              <strong className="font-mono">₹{swsAmount.toLocaleString()}</strong>
            </div>
            <div className="results-row">
              <span>Integrated GST ({igstRate}%):</span>
              <strong className="font-mono">₹{igstAmount.toLocaleString()}</strong>
            </div>
            <div className="results-row highlight">
              <span>Total Landed Shipment Cost:</span>
              <strong className="font-mono landed-total">₹{totalLandedCost.toLocaleString()}</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right', marginTop: '4px' }}>
              Effective Cumulative Duty: ~{effectiveDutyPct}% on CIF
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={handleInsert}>
            Insert into Chat Prompt ↳
          </button>
        </div>
      </div>
    </div>
  )
}
