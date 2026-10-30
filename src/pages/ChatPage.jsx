import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateBotReply, quickPrompts } from '../data/chatData'
import ThemeToggle from '../components/ThemeToggle'
import ChatMessageBubble from '../components/ChatMessageBubble'
import TariffCalculatorModal from '../components/TariffCalculatorModal'

const createLocalId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`

function ChatPage({ user, token, onLogout }) {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [activeTitle, setActiveTitle] = useState('New Inquiry')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isSending, setIsSending] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  // Extra Features & Glassmorphism Navigation
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isCalcOpen, setIsCalcOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingConvId, setEditingConvId] = useState(null)
  const [editingTitleText, setEditingTitleText] = useState('')

  const userName = useMemo(() => user?.name || 'Business User', [user])
  const activeToken = useMemo(() => token || localStorage.getItem('tariff_token') || '', [token])

  // Filtered conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(
      (c) => c.title.toLowerCase().includes(q) || (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    )
  }, [conversations, searchQuery])

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  // Fetch messages for a specific conversation
  const loadConversationMessages = useCallback(
    async (convId) => {
      setIsLoadingHistory(true)
      try {
        const res = await fetch(`/api/conversations/${convId}`, {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        })

        if (res.ok) {
          const result = await res.json()
          if (result.success && result.data?.messages) {
            setMessages(result.data.messages)
            setActiveConversationId(result.data.id)
            setActiveTitle(result.data.title)
            localStorage.setItem('tariff_active_conv', result.data.id)
          }
        }
      } catch (err) {
        console.warn('Failed to load conversation details:', err)
      } finally {
        setIsLoadingHistory(false)
      }
    },
    [activeToken]
  )

  // Load previous conversations list on mount
  useEffect(() => {
    let isMounted = true

    async function fetchConversations() {
      if (!activeToken) {
        setIsLoadingHistory(false)
        return
      }

      try {
        const res = await fetch('/api/conversations', {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        })

        if (res.ok && isMounted) {
          const result = await res.json()
          if (result.success && Array.isArray(result.data)) {
            setConversations(result.data)

            if (result.data.length > 0) {
              const savedConvId = localStorage.getItem('tariff_active_conv')
              const toSelect = result.data.find((c) => c.id === savedConvId) || result.data[0]

              setActiveConversationId(toSelect.id)
              setActiveTitle(toSelect.title)
              await loadConversationMessages(toSelect.id)
              return
            } else {
              // New user with no chats: start with clean slate
              setActiveConversationId('')
              setActiveTitle('New Inquiry')
              setMessages([])
              localStorage.removeItem('tariff_active_conv')
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load conversations from backend:', err)
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false)
        }
      }
    }

    fetchConversations()

    return () => {
      isMounted = false
    }
  }, [activeToken, loadConversationMessages])

  // Handle switching active conversation
  const handleSelectConversation = (conv) => {
    if (conv.id === activeConversationId) return
    loadConversationMessages(conv.id)
  }

  // Create a new clean chat session
  const handleNewChat = () => {
    setActiveConversationId('')
    setActiveTitle('New Inquiry')
    setMessages([])
    setDraft('')
    setSelectedFiles([])
    localStorage.removeItem('tariff_active_conv')
  }

  // Delete a previous conversation
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation()
    try {
      await fetch(`/api/conversations/${convId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      })
    } catch (err) {
      console.warn('Failed to delete on server:', err)
    }

    const remaining = conversations.filter((c) => c.id !== convId)
    setConversations(remaining)

    if (activeConversationId === convId) {
      if (remaining.length > 0) {
        loadConversationMessages(remaining[0].id)
      } else {
        handleNewChat()
      }
    }
  }

  // Rename conversation title
  const handleStartRename = (e, conv) => {
    e.stopPropagation()
    setEditingConvId(conv.id)
    setEditingTitleText(conv.title)
  }

  const handleSaveRename = async (e, convId) => {
    e.preventDefault()
    e.stopPropagation()
    const trimmed = editingTitleText.trim()
    if (!trimmed) {
      setEditingConvId(null)
      return
    }

    try {
      await fetch(`/api/conversations/${convId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ title: trimmed }),
      })

      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: trimmed } : c))
      )
      if (activeConversationId === convId) {
        setActiveTitle(trimmed)
      }
    } catch (err) {
      console.warn('Failed to rename session:', err)
    } finally {
      setEditingConvId(null)
    }
  }

  // Export full chat transcript as Markdown
  const handleExportTranscript = () => {
    if (messages.length === 0) return

    let content = `# TARIFFFLOW AI - TRADE INQUIRY TRANSCRIPT\n`
    content += `Title: ${activeTitle}\n`
    content += `Export Date: ${new Date().toISOString()}\n`
    content += `Operator: ${userName} (${user?.company || 'Commercial Logistics'})\n\n---\n\n`

    messages.forEach((m) => {
      const sender = m.sender === 'user' ? userName : 'TariffFlow AI Engine'
      const time = m.createdAt ? new Date(m.createdAt).toLocaleString() : ''
      content += `### [${sender}] - ${time}\n`
      content += `${m.text}\n`
      if (m.files && m.files.length > 0) {
        content += `Attachments: ${m.files.map((f) => f.name).join(', ')}\n`
      }
      content += `\n`
    })

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tariff-transcript-${activeConversationId || 'session'}.md`
    a.click()
    URL.revokeObjectURL(a)
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
  }

  const handleLogout = () => {
    localStorage.removeItem('tariff_active_conv')
    onLogout()
    navigate('/login')
  }

  const handleSend = async () => {
    const trimmedMessage = draft.trim()

    if (!trimmedMessage && selectedFiles.length === 0) {
      return
    }

    const filesToSend = [...selectedFiles]
    const userMessage = {
      id: createLocalId('msg-user'),
      sender: 'user',
      text: trimmedMessage || 'Please review the attached document.',
      files: filesToSend.map((file) => ({ name: file.name, size: file.size })),
      createdAt: new Date().toISOString(),
    }

    setMessages((current) => [...current, userMessage])
    setDraft('')
    setSelectedFiles([])
    setIsSending(true)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    let replyText = ''

    try {
      const formData = new FormData()
      formData.append('message', trimmedMessage || 'Please review the attached customs document.')
      if (activeConversationId) {
        formData.append('conversationId', activeConversationId)
      }
      filesToSend.slice(0, 3).forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const { conversationId, conversationTitle, messages: serverMessages, reply } = result.data

          if (serverMessages && Array.isArray(serverMessages)) {
            setMessages(serverMessages)
          } else if (reply) {
            replyText = reply
          }

          if (conversationTitle) {
            setActiveTitle(conversationTitle)
          }

          // Update conversations list in sidebar
          setConversations((prev) => {
            const exists = prev.some((c) => c.id === conversationId)
            if (exists) {
              return prev.map((c) =>
                c.id === conversationId
                  ? {
                      ...c,
                      title: conversationTitle || c.title,
                      lastMessage: trimmedMessage || 'Document upload',
                      updatedAt: new Date().toISOString(),
                    }
                  : c
              )
            } else {
              return [
                {
                  id: conversationId,
                  title: conversationTitle || 'New Trade Inquiry',
                  lastMessage: trimmedMessage || 'Document upload',
                  messageCount: 2,
                  updatedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                },
                ...prev,
              ]
            }
          })

          if (conversationId && conversationId !== activeConversationId) {
            setActiveConversationId(conversationId)
            localStorage.setItem('tariff_active_conv', conversationId)
          }
        }
      }
    } catch (err) {
      console.warn('Backend chat API call error:', err)
    }

    if (!replyText && (!messages || messages.length === 0)) {
      replyText = generateBotReply(trimmedMessage || 'customs document')
      const botMessage = {
        id: createLocalId('msg-bot'),
        sender: 'bot',
        text: replyText,
        createdAt: new Date().toISOString(),
      }
      setMessages((current) => [...current, botMessage])
    }

    setIsSending(false)
  }

  return (
    <div className="chat-layout">
      {/* Sidebar: Navigation, Profile, Chat History, Suggested Prompts */}
      <aside className={`chat-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-wrap">
            <div className="brand-mark">TF</div>
            <div className="brand-text">
              <span className="brand-name">TariffFlow AI</span>
              <span className="brand-tag">Trade Assistant</span>
            </div>
          </div>
          {/* Hide Left Bar Icon on the top right side of left bar */}
          <button
            type="button"
            className="collapse-sidebar-btn"
            onClick={() => setIsSidebarCollapsed(true)}
            title="Hide left sidebar"
            aria-label="Hide left sidebar"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        <div className="profile-hud">
          {user?.avatar ? (
            <img src={user.avatar} alt={userName} className="avatar" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="avatar">{userName.charAt(0)}</div>
          )}
          <div className="profile-details">
            <div className="profile-name">
              {userName}
              {user?.provider === 'google' && (
                <span style={{ fontSize: '0.65rem', marginLeft: '6px', color: '#4285f4', fontWeight: 600 }}>
                  Google
                </span>
              )}
            </div>
            <div className="profile-company">{user?.company || 'Commercial Logistics'}</div>
          </div>
        </div>

        <button type="button" className="new-chat-btn" onClick={handleNewChat}>
          <span>+</span> New Chat
        </button>

        <div className="sidebar-scrollable">
          <div className="sidebar-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3>Chat History ({conversations.length})</h3>
            </div>

            {/* Session Search Bar */}
            {conversations.length > 2 && (
              <div className="session-search-box">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="session-search-input"
                />
              </div>
            )}

            {isLoadingHistory && conversations.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '8px 0', fontFamily: 'var(--font-mono)' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '8px 0' }}>
                {conversations.length === 0 ? 'No saved chats yet. Start a conversation below.' : 'No matching conversations.'}
              </div>
            ) : (
              <div className="conversations-container">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${conv.id === activeConversationId ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="conv-info">
                      {editingConvId === conv.id ? (
                        <form onSubmit={(e) => handleSaveRename(e, conv.id)} className="inline-rename-form">
                          <input
                            type="text"
                            value={editingTitleText}
                            autoFocus
                            onChange={(e) => setEditingTitleText(e.target.value)}
                            onBlur={(e) => handleSaveRename(e, conv.id)}
                            className="inline-rename-input"
                          />
                        </form>
                      ) : (
                        <>
                          <div className="conv-title">{conv.title}</div>
                          <div className="conv-preview">{conv.lastMessage}</div>
                        </>
                      )}
                    </div>
                    <div className="conv-actions">
                      <button
                        type="button"
                        className="conv-edit-btn"
                        title="Rename conversation"
                        onClick={(e) => handleStartRename(e, conv)}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="conv-delete-btn"
                        title="Delete conversation"
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Suggested Questions</h3>
            <div className="quick-prompts-list">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="quick-prompt-btn"
                  onClick={() => setDraft(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button
            type="button"
            className="secondary-button"
            style={{ width: '100%', fontSize: '0.82rem' }}
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </aside>


      {/* Main Chat Workspace */}
      <main className="chat-panel">
        <header className="chat-header">
          <div className="header-left-group">
            {isSidebarCollapsed && (
              <button
                type="button"
                className="open-sidebar-btn"
                onClick={() => setIsSidebarCollapsed(false)}
                title="Show left sidebar"
                aria-label="Show left sidebar"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
            <div className="chat-header-title">
              <span className="eyebrow" style={{ marginBottom: 0 }}>AI Customs & Trade Assistant</span>
              <h2>
                {activeTitle}
                {activeConversationId && (
                  <span className="active-chat-pill">Saved Session</span>
                )}
              </h2>
            </div>
          </div>
          <div className="chat-header-actions">
            {/* Tariff Calculator Quick Tool */}
            <button
              type="button"
              className="secondary-button small-button"
              onClick={() => setIsCalcOpen(true)}
              title="Open Landed Duty Estimator"
            >
              ⚡ Calculator
            </button>

            {/* Transcript Exporter */}
            {messages.length > 0 && (
              <button
                type="button"
                className="secondary-button small-button"
                onClick={handleExportTranscript}
                title="Export chat transcript as Markdown"
              >
                ↓ Export
              </button>
            )}

            <ThemeToggle />

            <button type="button" className="secondary-button small-button" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </header>

        <div className="chat-messages">
          {isLoadingHistory ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Loading conversation history...
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty-state">
              <div className="empty-state-badge">Customs AI Assistant</div>
              <h3>How can I help with your trade & customs today?</h3>
              <p>
                Ask about import duties, calculate landed costs, verify HS code classifications,
                or upload a customs notice to review duty liabilities.
              </p>
              <div className="empty-prompt-chips">
                {quickPrompts.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="empty-prompt-chip"
                    onClick={() => setDraft(prompt)}
                  >
                    <span>↳</span> {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} userName={userName} />
            ))
          )}

          {/* Activity pulse indicator when generating */}
          {isSending && (
            <div className="message-row bot">
              <div className="analyzing-hud">
                <div className="analyzing-pulse-bars">
                  <div className="pulse-bar" />
                  <div className="pulse-bar" />
                  <div className="pulse-bar" />
                </div>
                <div className="analyzing-text">
                  <span className="analyzing-title">CALCULATING DUTIES & ANALYZING REGULATIONS</span>
                  <span className="analyzing-subtitle">Checking HS code classifications, customs circulars, and landed duty impact...</span>
                </div>
              </div>
            </div>
          )}


          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Floating Pill Composer Bar */}
        <div className="floating-composer-wrap">
          <div className="floating-composer-inner">
            {/* Attachment preview pills above the input pill */}
            {selectedFiles.length > 0 && (
              <div className="pill-attachments-row">
                {selectedFiles.map((file, idx) => (
                  <span key={`${file.name}-${idx}`} className="attachment-pill">
                    📎 {file.name}
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: '6px' }}
                      onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                      title="Remove document"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* The Floating Pill */}
            <div className="composer-pill">
              {/* + Icon to add file */}
              <label className="pill-action-btn" title="Add file (PDF, DOC, XLS, CSV, Image)">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv"
                  onChange={handleFileChange}
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </label>

              {/* Minimal Calculator Icon */}
              <button
                type="button"
                className="pill-action-btn"
                onClick={() => setIsCalcOpen(true)}
                title="Open Landed Duty Estimator"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2" />
                  <line x1="8" x2="16" y1="6" y2="6" />
                  <line x1="16" x2="16" y1="14" y2="18" />
                  <path d="M16 10h.01" />
                  <path d="M12 10h.01" />
                  <path d="M8 10h.01" />
                  <path d="M12 14h.01" />
                  <path d="M8 14h.01" />
                  <path d="M12 18h.01" />
                  <path d="M8 18h.01" />
                </svg>
              </button>

              {/* User text input */}
              <textarea
                className="pill-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={1}
                placeholder="Ask about tariffs, HS classifications, or upload a customs notice..."
              />

              {/* Right Side Up-Arrow Send Icon */}
              <button
                type="button"
                className={`pill-send-btn ${draft.trim() || selectedFiles.length > 0 ? 'active' : ''}`}
                disabled={isSending || (!draft.trim() && selectedFiles.length === 0)}
                onClick={handleSend}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                {isSending ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Tariff Calculator Modal */}
      <TariffCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onInsertPrompt={(prompt) => setDraft(prompt)}
      />
    </div>
  )
}

export default ChatPage
