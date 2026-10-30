import { useState } from 'react'

// Simple robust markdown parser for technical responses without heavy external dependencies
function formatBotMarkdown(text = '') {
  const lines = text.split('\n')
  const elements = []
  let listItems = []

  const flushList = (keyPrefix) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list`} className="bot-bullet-list">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
          ))}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList(index)
      return
    }

    // Header 3 (###)
    if (trimmed.startsWith('### ')) {
      flushList(index)
      elements.push(
        <h4 key={index} className="bot-msg-heading">
          {trimmed.replace('### ', '')}
        </h4>
      )
      return
    }

    // Bullet points (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2))
      return
    }

    // Numbered lists (1., 2., etc.)
    if (/^\d+\.\s/.test(trimmed)) {
      flushList(index)
      elements.push(
        <div key={index} className="bot-numbered-item">
          <span className="number-badge">{trimmed.match(/^\d+\./)[0]}</span>
          <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(trimmed.replace(/^\d+\.\s/, '')) }} />
        </div>
      )
      return
    }

    flushList(index)

    // Standard paragraph
    elements.push(
      <p key={index} className="bot-msg-paragraph" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(trimmed) }} />
    )
  })

  flushList('final')
  return elements
}

function renderInlineMarkdown(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bot-code-pill">$1</code>')
}

export default function ChatMessageBubble({ message, userName = 'You' }) {
  const [copied, setCopied] = useState(false)
  const isBot = message.sender === 'bot'

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadReport = () => {
    const content = `TARIFFFLOW AI - CUSTOMS & DUTY REPORT\nGenerated: ${new Date().toISOString()}\n\n${message.text}\n\nDisclaimer: Automated trade guidance for commercial reference.`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customs-report-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(a)
  }

  if (!isBot) {
    return (
      <div className="message-row user">
        <div className="message-bubble user-bubble">
          <div className="message-meta-row user-meta">
            <span className="sender-name">{userName}</span>
            {formattedTime && <span className="meta-time">{formattedTime}</span>}
          </div>
          <p className="user-text">{message.text}</p>
          {message.files && message.files.length > 0 && (
            <div className="attachment-list">
              {message.files.map((file, idx) => (
                <span key={`${file.name}-${idx}`} className="attachment-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {file.name}
                  {file.size ? <span className="file-size-tag">({(file.size / 1024).toFixed(0)} KB)</span> : null}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="message-row bot">
      <div className="message-bubble bot-bubble">
        {/* Technical Bot Header */}
        <div className="bot-header-hud">
          <div className="bot-identity">
            <span className="bot-mark-chip">TF</span>
            <span className="bot-name">TariffFlow AI Assistant</span>
          </div>
          <div className="bot-meta-right">
            <span className="bot-status-tag">Customs Schedule 2026</span>
            {formattedTime && <span className="meta-time">{formattedTime}</span>}
          </div>
        </div>

        {/* Formatted Content */}
        <div className="bot-formatted-content">
          {formatBotMarkdown(message.text)}
        </div>

        {message.files && message.files.length > 0 && (
          <div className="attachment-list">
            {message.files.map((file, idx) => (
              <span key={`${file.name}-${idx}`} className="attachment-pill">
                📄 {file.name}
              </span>
            ))}
          </div>
        )}

        {/* Message Action Footer */}
        <div className="bot-actions-toolbar">
          <div className="toolbar-left">
            <button
              type="button"
              className="msg-action-btn"
              onClick={handleCopy}
              title="Copy response to clipboard"
            >
              {copied ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="msg-action-btn"
              onClick={handleDownloadReport}
              title="Download structured duty report"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              <span>Export Report</span>
            </button>
          </div>

          <div className="statutory-cite">
            <span>Reference: Customs Tariff Schedule & Regulations</span>
          </div>
        </div>
      </div>
    </div>
  )
}

