import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Send, ArrowLeft, User, Phone, Video, MoreVertical, Smile, Paperclip, Trash2, CheckCheck } from 'lucide-react';
import './ChatPage.css';

const ChatPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Определяем мобильное разрешение
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Загрузка списка чатов
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchChats();
  }, [token, navigate]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Загрузка сообщений при выборе чата
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat || sending) return;

    setSending(true);
    const text = messageInput.trim();
    setMessageInput('');

    try {
      const response = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
        
        // Обновляем последнее сообщение в списке чатов
        setChats(prev => prev.map(chat =>
          chat.id === selectedChat.id
            ? { ...chat, last_message: text, last_message_time: new Date().toISOString() }
            : chat
        ));
      } else {
        setMessageInput(text);
        console.error('Ошибка отправки');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setMessageInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  const createNewChat = async (userId) => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otherUserId: userId })
      });
      if (response.ok) {
        const { chatId } = await response.json();
        fetchChats();
        const newChat = chats.find(c => c.id === chatId);
        if (newChat) {
          setSelectedChat(newChat);
        }
      }
    } catch (error) {
      console.error('Ошибка создания чата:', error);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const formatChatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  // Десктопная версия
  if (!isMobileView) {
    return (
      <div className="chat-page">
        <div className="chat-container desktop">
          {/* Список чатов */}
          <div className="chat-list">
            <div className="chat-list-header">
              <h2>Сообщения</h2>
              <button className="new-chat-btn" onClick={() => navigate('/users')}>+ Новый чат</button>
            </div>
            <div className="chat-list-items">
              {loading ? (
                <div className="chat-loading">Загрузка...</div>
              ) : chats.length === 0 ? (
                <div className="chat-empty-list">
                  <div className="chat-empty-icon">💬</div>
                  <p>У вас пока нет диалогов</p>
                  <button className="start-chat-btn" onClick={() => navigate('/users')}>Начать диалог</button>
                </div>
              ) : (
                chats.map(chat => (
                  <div
                    key={chat.id}
                    className={`chat-list-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="chat-avatar">
                      <div className="avatar-placeholder">{chat.first_name?.[0] || chat.last_name?.[0] || 'U'}</div>
                    </div>
                    <div className="chat-info">
                      <div className="chat-name">{chat.first_name} {chat.last_name}</div>
                      <div className="chat-last-message">{chat.last_message || 'Новое сообщение'}</div>
                    </div>
                    <div className="chat-meta">
                      <div className="chat-time">{formatChatTime(chat.last_message_time)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Область переписки */}
          <div className="chat-area">
            {selectedChat ? (
              <>
                <div className="chat-header">
                  <div className="chat-header-info">
                    <div className="chat-avatar">
                      <div className="avatar-placeholder">{selectedChat.first_name?.[0] || selectedChat.last_name?.[0] || 'U'}</div>
                    </div>
                    <div className="chat-header-details">
                      <h3>{selectedChat.first_name} {selectedChat.last_name}</h3>
                      <span className="chat-status">в сети</span>
                    </div>
                  </div>
                  <div className="chat-header-actions">
                    <button><Phone size={20} /></button>
                    <button><Video size={20} /></button>
                    <button><MoreVertical size={20} /></button>
                  </div>
                </div>

                <div className="chat-messages" ref={chatContainerRef}>
                  {messages.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      className={`message ${msg.sender_id === user?.id ? 'message-own' : 'message-other'}`}
                    >
                      <div className="message-bubble">
                        <div className="message-text">{msg.message}</div>
                        <div className="message-time">{formatMessageTime(msg.created_at)}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                  <button className="attach-btn"><Paperclip size={20} /></button>
                  <button className="emoji-btn"><Smile size={20} /></button>
                  <textarea
                    className="chat-input"
                    placeholder="Введите сообщение..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={1}
                    disabled={sending}
                  />
                  <button className="send-btn" onClick={handleSendMessage} disabled={sending}>
                    <Send size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="chat-empty">
                <div className="chat-empty-icon">💬</div>
                <h3>Выберите чат</h3>
                <p>Нажмите на диалог, чтобы начать общение</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Мобильная версия
  return (
    <div className="chat-page">
      <div className="chat-container mobile">
        {!selectedChat ? (
          <div className="chat-list">
            <div className="chat-list-header">
              <h2>Сообщения</h2>
              <button className="new-chat-btn" onClick={() => navigate('/users')}>+</button>
            </div>
            <div className="chat-list-items">
              {loading ? (
                <div className="chat-loading">Загрузка...</div>
              ) : chats.length === 0 ? (
                <div className="chat-empty-list">
                  <div className="chat-empty-icon">💬</div>
                  <p>У вас пока нет диалогов</p>
                </div>
              ) : (
                chats.map(chat => (
                  <div
                    key={chat.id}
                    className="chat-list-item"
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="chat-avatar">
                      <div className="avatar-placeholder">{chat.first_name?.[0] || chat.last_name?.[0] || 'U'}</div>
                    </div>
                    <div className="chat-info">
                      <div className="chat-name">{chat.first_name} {chat.last_name}</div>
                      <div className="chat-last-message">{chat.last_message || 'Новое сообщение'}</div>
                    </div>
                    <div className="chat-meta">
                      <div className="chat-time">{formatChatTime(chat.last_message_time)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <button className="back-btn-chat" onClick={handleBackToList}>
                <ArrowLeft size={24} />
              </button>
              <div className="chat-header-info">
                <div className="chat-avatar">
                  <div className="avatar-placeholder">{selectedChat.first_name?.[0] || selectedChat.last_name?.[0] || 'U'}</div>
                </div>
                <div className="chat-header-details">
                  <h3>{selectedChat.first_name} {selectedChat.last_name}</h3>
                  <span className="chat-status">в сети</span>
                </div>
              </div>
              <button className="menu-btn-chat"><MoreVertical size={20} /></button>
            </div>

            <div className="chat-messages" ref={chatContainerRef}>
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`message ${msg.sender_id === user?.id ? 'message-own' : 'message-other'}`}
                >
                  <div className="message-bubble">
                    <div className="message-text">{msg.message}</div>
                    <div className="message-time">{formatMessageTime(msg.created_at)}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <button className="attach-btn"><Paperclip size={20} /></button>
              <textarea
                className="chat-input"
                placeholder="Сообщение..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
                disabled={sending}
              />
              <button className="send-btn" onClick={handleSendMessage} disabled={sending}>
                <Send size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;