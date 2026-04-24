import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Send, ArrowLeft } from 'lucide-react';
import io from 'socket.io-client';
import './ChatPage.css';

const ChatPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  /* ================= RESPONSIVE ================= */
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!token) return;

    socketRef.current = io('/', {
      auth: { token },
      transports: ['websocket']
    });

    socketRef.current.on('new_message', (data) => {
      if (selectedChat?.id === data.chatId) {
        setMessages(prev => [...prev, data.message]);
      }

      setChats(prev =>
        prev.map(chat =>
          chat.id === data.chatId
            ? {
                ...chat,
                last_message: data.message.message,
                last_message_time: data.message.created_at
              }
            : chat
        )
      );
    });

    return () => socketRef.current?.disconnect();
  }, [token, selectedChat]);

  /* ================= DATA ================= */
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchChats();
  }, [token]);

  useEffect(() => {
    if (selectedChat) fetchMessages(selectedChat.id);
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setChats(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  /* ================= SEND ================= */
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;

    const text = messageInput.trim();
    setMessageInput('');
    setSending(true);

    const tempMessage = {
      id: Date.now(),
      sender_id: user.id,
      message: text,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);

    socketRef.current?.emit('send_message', {
      chatId: selectedChat.id,
      message: text,
      receiverId: selectedChat.other_user_id
    });

    setTimeout(() => setSending(false), 200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (t) =>
    t
      ? new Date(t).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';

  /* ================= MOBILE UI ================= */
  if (isMobile) {
    return (
      <div className="chat-page">

        {!selectedChat ? (
          /* ===== CHAT LIST MOBILE ===== */
          <div className="chat-list">

            <div className="chat-list-header">
              <h2>Чаты</h2>
              <button
                className="new-chat-btn"
                onClick={() => navigate('/users')}
              >
                +
              </button>
            </div>

            <div className="chat-list-items">
              {loading ? (
                <div className="chat-empty">Загрузка...</div>
              ) : chats.map(chat => (
                <div
                  key={chat.id}
                  className="chat-list-item"
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="avatar-placeholder">
                    {chat.first_name?.[0] || 'U'}
                  </div>

                  <div>
                    <div className="chat-name">
                      {chat.first_name} {chat.last_name}
                    </div>
                    <div className="chat-last-message">
                      {chat.last_message || '...'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          /* ===== CHAT SCREEN MOBILE ===== */
          <div className="chat-area">

            {/* HEADER */}
            <div className="chat-header">
              <button onClick={() => setSelectedChat(null)}>
                <ArrowLeft size={18} />
              </button>

              <h3>
                {selectedChat.first_name} {selectedChat.last_name}
              </h3>
            </div>

            {/* MESSAGES */}
            <div className="chat-messages">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message ${
                    msg.sender_id === user.id
                      ? 'message-own'
                      : 'message-other'
                  }`}
                >
                  <div className="message-bubble">
                    {msg.message}
                    <div className="message-time">
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="chat-input-area">
              <textarea
                className="chat-input"
                placeholder="Сообщение..."
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height =
                    e.target.scrollHeight + 'px';
                }}
                onKeyDown={handleKeyDown}
              />

              <button
                className="send-btn"
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sending}
              >
                <Send size={16} />
              </button>
            </div>

          </div>
        )}

      </div>
    );
  }

  /* ================= DESKTOP ================= */
  return (
    <div className="chat-page">
      <div className="chat-container desktop">

        {/* SIDEBAR */}
        <div className="chat-list">
          <div className="chat-list-header">
            <h2>Чаты</h2>
            <button onClick={() => navigate('/users')}>
              Новый чат
            </button>
          </div>

          <div className="chat-list-items">
            {chats.map(chat => (
              <div
                key={chat.id}
                className="chat-list-item"
                onClick={() => setSelectedChat(chat)}
              >
                <div className="avatar-placeholder">
                  {chat.first_name?.[0] || 'U'}
                </div>

                <div>
                  <div className="chat-name">
                    {chat.first_name} {chat.last_name}
                  </div>
                  <div className="chat-last-message">
                    {chat.last_message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT */}
        <div className="chat-area">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <h3>
                  {selectedChat.first_name} {selectedChat.last_name}
                </h3>
              </div>

              <div className="chat-messages">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`message ${
                      msg.sender_id === user.id
                        ? 'message-own'
                        : 'message-other'
                    }`}
                  >
                    <div className="message-bubble">
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-area">
                <textarea
                  className="chat-input"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />

                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="chat-empty">Выберите чат</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatPage;