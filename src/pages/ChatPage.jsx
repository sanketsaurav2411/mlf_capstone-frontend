import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateBotReply, initialMessages, quickPrompts } from '../data/chatData'
import ThemeToggle from '../components/ThemeToggle'

const createLocalId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`

function ChatPage({ user, token, onLogout }) {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [activeTitle, setActiveTitle] = useState('Customs & tariff guidance')
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isSending, setIsSending] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  const userName = useMemo(() => user?.name || 'Business User', [user])
  const activeToken = useMemo(() => token || localStorage.getItem('tariff_token') || '', [token])

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
          if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            setConversations(result.data)

            // Select previously saved or first conversation
            const savedConvId = localStorage.getItem('tariff_active_conv')
            const toSelect = result.data.find((c) => c.id === savedConvId) || result.data[0]

            setActiveConversationId(toSelect.id)
            setActiveTitle(toSelect.title)
            await loadConversationMessages(toSelect.id)
            return
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

  // Create a new blank chat session
  const handleNewChat = async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          title: 'New Trade Inquiry',
        }),
      })

      if (res.ok) {
        const result = await res.json()
        if (result.success && result.data) {
          const newConv = result.data
          setConversations((prev) => [
            {
              id: newConv.id,
              title: newConv.title,
              lastMessage: 'Started new session',
              messageCount: 1,
              updatedAt: newConv.updatedAt,
              createdAt: newConv.createdAt,
            },
            ...prev,
          ])
          setActiveConversationId(newConv.id)
          setActiveTitle(newConv.title)
          setMessages(newConv.messages)
          localStorage.setItem('tariff_active_conv', newConv.id)
          return
        }
      }
    } catch (err) {
      console.warn('Failed to create new conversation on backend:', err)
    }

    // Local fallback
    const localId = createLocalId('conv-local')
    setActiveConversationId(localId)
    setActiveTitle('New Trade Inquiry')
    setMessages(initialMessages)
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
      }
      setMessages((current) => [...current, botMessage])
    }

    setIsSending(false)
  }

  return (
    <div className="chat-layout">
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <div className="brand-wrap">
            <div className="brand-mark">TF</div>
            <div className="brand-text">
              <span className="brand-name">TariffFlow AI</span>
              <span className="brand-tag">Trade Telemetry</span>
            </div>
          </div>
        </div>

        <div className="profile-hud">
          <div className="avatar">{userName.charAt(0)}</div>
          <div className="profile-details">
            <div className="profile-name">{userName}</div>
            <div className="profile-company">{user?.company || 'Commercial Logistics'}</div>
          </div>
        </div>

        <button type="button" className="new-chat-btn" onClick={handleNewChat}>
          <span>+</span> New Chat
        </button>

        <div className="sidebar-scrollable">
          <div className="sidebar-section">
            <h3>Previous Sessions ({conversations.length})</h3>
            {isLoadingHistory && conversations.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '8px 0', fontFamily: 'var(--font-mono)' }}>
                Loading session telemetry...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '8px 0' }}>
                No active records. Initiate query below.
              </div>
            ) : (
              <div className="conversations-container">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${conv.id === activeConversationId ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="conv-info">
                      <div className="conv-title">{conv.title}</div>
                      <div className="conv-preview">{conv.lastMessage}</div>
                    </div>
                    <div className="conv-actions">
                      <button
                        type="button"
                        className="conv-delete-btn"
                        title="Delete session"
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
            <h3>Calibrated Prompts</h3>
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
            Terminate Session
          </button>
        </div>
      </aside>

      <main className="chat-panel">
        <header className="chat-header">
          <div className="chat-header-title">
            <span className="eyebrow" style={{ marginBottom: 0 }}>Empirical Customs Workspace</span>
            <h2>
              {activeTitle}
              {activeConversationId && (
                <span className="active-chat-pill">Active Memory</span>
              )}
            </h2>
          </div>
          <div className="chat-header-actions">
            <ThemeToggle />
            <button type="button" className="secondary-button small-button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <div className="chat-messages">
          {isLoadingHistory ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading conversation history...
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`message-row ${message.sender}`}>
                <div className="message-bubble">
                  <p>{message.text}</p>
                  {message.files && message.files.length > 0 && (
                    <div className="attachment-list">
                      {message.files.map((file) => (
                        <span key={`${message.id}-${file.name}`} className="attachment-pill">
                          📄 {file.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="composer">
          <div className="file-upload-row">
            <label className="upload-button">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv"
                onChange={handleFileChange}
              />
              Upload document
            </label>
            {selectedFiles.length > 0 && (
              <div className="selected-files">
                {selectedFiles.map((file) => (
                  <span key={file.name} className="attachment-pill">
                    📎 {file.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="input-row">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows="3"
              placeholder="Ask a question about tariff, customs duty, or follow up on previous answers..."
            />
            <button
              type="button"
              className="primary-button send-button"
              disabled={isSending}
              onClick={handleSend}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ChatPage
