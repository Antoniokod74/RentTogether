import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Send, ArrowLeft, User, Phone, Video, MoreVertical, Smile, Paperclip } from 'lucide-react';
import io from 'socket.io-client';
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
  
  // WebSocket
  const socketRef = useRef(null);
  const socketInitialized = useRef(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Определяем мобильное разрешение
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Блокировка скролла body на мобильных при открытом чате
  useEffect(() => {
    if (isMobileView && selectedChat) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMobileView, selectedChat]);

  // Подключение к WebSocket
  useEffect(() => {
    const authToken = localStorage.getItem('token');
    if (!authToken || socketInitialized.current) return;
    
    socketInitialized.current = true;
    
    socketRef.current = io('/', {
      auth: { token: authToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    socketRef.current.on('connect', () => {
      console.log('📡 WebSocket connected');
      setSocketConnected(true);
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('📡 WebSocket disconnected');
      setSocketConnected(false);
    });
    
    socketRef.current.on('new_message', (data) => {
      console.log('📩 Новое сообщение:', data);
      
      if (selectedChat && selectedChat.id === data.chatId) {
        setMessages(prev => [...prev, data.message]);
      }
      
      setChats(prev => prev.map(chat =>
        chat.id === data.chatId
          ? { 
              ...chat, 
              last_message: data.message.message, 
              last_message_time: data.message.created_at 
            }
          : chat
      ));
    });
    
    socketRef.current.on('message_sent', (message) => {
      console.log('✅ Сообщение отправлено:', message);
      setMessages(prev => prev.map(msg => 
        msg.id === message.tempId ? { ...message, tempId: undefined } : msg
      ));
    });
    
    socketRef.current.on('message_error', (data) => {
      console.error('❌ Ошибка отправки:', data.error);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketInitialized.current = false;
      }
    };
  }, [selectedChat]);

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

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat || sending) return;

    const text = messageInput.trim();
    setMessageInput('');
    setSending(true);

    if (socketConnected && socketRef.current) {
      const tempId = Date.now();
      
      const tempMessage = {
        id: tempId,
        sender_id: user?.id,
        message: text,
        created_at: new Date().toISOString(),
        is_read: false
      };
      setMessages(prev => [...prev, tempMessage]);
      
      setChats(prev => prev.map(chat =>
        chat.id === selectedChat.id
          ? { ...chat, last_message: text, last_message_time: new Date().toISOString() }
          : chat
      ));
      
      socketRef.current.emit('send_message', {
        chatId: selectedChat.id,
        message: text,
        receiverId: selectedChat.other_user_id,
        tempId: tempId
      });
      
      setSending(false);
    } else {
      // Fallback на REST API
      fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      })
        .then(response => {
          if (response.ok) return response.json();
          throw new Error('Ошибка отправки');
        })
        .then(newMessage => {
          setMessages(prev => [...prev, newMessage]);
          setChats(prev => prev.map(chat =>
            chat.id === selectedChat.id
              ? { ...chat, last_message: text, last_message_time: new Date().toISOString() }
              : chat
          ));
        })
        .catch(error => {
          console.error('Ошибка:', error);
          setMessageInput(text);
        })
        .finally(() => {
          setSending(false);
        });
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