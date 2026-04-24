import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, ArrowLeft, User, Phone, Video, MoreVertical, Smile, Paperclip } from 'lucide-react';
import './ChatPage.css';

const ChatPage = () => {
  const { user } = useAuth();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState({});
  const [chats, setChats] = useState([]);
  const messagesEndRef = useRef(null);

  // Определяем мобильное разрешение
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
      if (window.innerWidth > 768 && selectedChat) {
        // На десктопе оставляем выбранный чат
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedChat]);

  // Загрузка списка чатов (заглушка, замени на API)
  useEffect(() => {
    // TODO: Заменить на реальный API запрос
    const mockChats = [
      { id: 1, name: 'Анна Иванова', avatar: null, lastMessage: 'Когда сможете показать машину?', lastMessageTime: '14:30', unread: 2 },
      { id: 2, name: 'Дмитрий Петров', avatar: null, lastMessage: 'Спасибо за аренду!', lastMessageTime: '12:15', unread: 0 },
      { id: 3, name: 'Елена Смирнова', avatar: null, lastMessage: 'Документы отправила', lastMessageTime: 'вчера', unread: 0 },
      { id: 4, name: 'Поддержка RentTogether', avatar: null, lastMessage: 'Чем можем помочь?', lastMessageTime: 'вчера', unread: 0 },
    ];
    setChats(mockChats);

    // Загрузка сообщений для каждого чата (заглушка)
    const mockMessages = {
      1: [
        { id: 1, senderId: 2, text: 'Здравствуйте! Интересует ваша машина', time: '14:00', isOwn: false },
        { id: 2, senderId: 1, text: 'Добрый день! Какая именно?', time: '14:05', isOwn: true },
        { id: 3, senderId: 2, text: 'Toyota Camry', time: '14:10', isOwn: false },
        { id: 4, senderId: 1, text: 'Когда сможете показать машину?', time: '14:20', isOwn: true },
        { id: 5, senderId: 2, text: 'Можно завтра после 15:00', time: '14:25', isOwn: false },
      ],
      2: [
        { id: 1, senderId: 2, text: 'Спасибо за аренду!', time: '12:15', isOwn: false },
        { id: 2, senderId: 1, text: 'Был рад помочь!', time: '12:20', isOwn: true },
      ],
      3: [
        { id: 1, senderId: 3, text: 'Документы отправила', time: 'вчера', isOwn: false },
        { id: 2, senderId: 1, text: 'Принял, спасибо!', time: 'вчера', isOwn: true },
      ],
      4: [
        { id: 1, senderId: 4, text: 'Чем можем помочь?', time: 'вчера', isOwn: false },
        { id: 2, senderId: 1, text: 'Как забронировать машину?', time: 'вчера', isOwn: true },
        { id: 3, senderId: 4, text: 'Нажмите "Арендовать" на странице авто', time: 'вчера', isOwn: false },
      ],
    };
    setMessages(mockMessages);
  }, []);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;

    const newMessage = {
      id: Date.now(),
      senderId: user?.id || 1,
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };

    setMessages(prev => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage]
    }));

    // Обновляем последнее сообщение в списке чатов
    setChats(prev => prev.map(chat =>
      chat.id === selectedChat.id
        ? { ...chat, lastMessage: messageInput, lastMessageTime: newMessage.time }
        : chat
    ));

    setMessageInput('');

    // TODO: Отправить сообщение на сервер
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

  // Десктопная версия (две колонки)
  if (!isMobileView) {
    return (
      <div className="chat-page">
        <div className="chat-container desktop">
          {/* Список чатов */}
          <div className="chat-list">
            <div className="chat-list-header">
              <h2>Сообщения</h2>
              <button className="new-chat-btn">+ Новый чат</button>
            </div>
            <div className="chat-list-items">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className={`chat-list-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="chat-avatar">
                    {chat.avatar ? (
                      <img src={chat.avatar} alt={chat.name} />
                    ) : (
                      <div className="avatar-placeholder">{chat.name[0]}</div>
                    )}
                  </div>
                  <div className="chat-info">
                    <div className="chat-name">{chat.name}</div>
                    <div className="chat-last-message">{chat.lastMessage}</div>
                  </div>
                  <div className="chat-meta">
                    <div className="chat-time">{chat.lastMessageTime}</div>
                    {chat.unread > 0 && <div className="chat-unread">{chat.unread}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Область переписки */}
          <div className="chat-area">
            {selectedChat ? (
              <>
                <div className="chat-header">
                  <div className="chat-header-info">
                    <div className="chat-avatar">
                      <div className="avatar-placeholder">{selectedChat.name[0]}</div>
                    </div>
                    <div className="chat-header-details">
                      <h3>{selectedChat.name}</h3>
                      <span className="chat-status">в сети</span>
                    </div>
                  </div>
                  <div className="chat-header-actions">
                    <button><Phone size={20} /></button>
                    <button><Video size={20} /></button>
                    <button><MoreVertical size={20} /></button>
                  </div>
                </div>

                <div className="chat-messages">
                  {messages[selectedChat.id]?.map((msg, index) => (
                    <div
                      key={msg.id}
                      className={`message ${msg.isOwn ? 'message-own' : 'message-other'}`}
                    >
                      <div className="message-bubble">
                        <div className="message-text">{msg.text}</div>
                        <div className="message-time">{msg.time}</div>
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
                  />
                  <button className="send-btn" onClick={handleSendMessage}>
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

  // Мобильная версия (полноэкранный режим)
  return (
    <div className="chat-page">
      <div className="chat-container mobile">
        {!selectedChat ? (
          // Список чатов
          <div className="chat-list">
            <div className="chat-list-header">
              <h2>Сообщения</h2>
              <button className="new-chat-btn">+</button>
            </div>
            <div className="chat-list-items">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className="chat-list-item"
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="chat-avatar">
                    <div className="avatar-placeholder">{chat.name[0]}</div>
                  </div>
                  <div className="chat-info">
                    <div className="chat-name">{chat.name}</div>
                    <div className="chat-last-message">{chat.lastMessage}</div>
                  </div>
                  <div className="chat-meta">
                    <div className="chat-time">{chat.lastMessageTime}</div>
                    {chat.unread > 0 && <div className="chat-unread">{chat.unread}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Окно переписки
          <>
            <div className="chat-header">
              <button className="back-btn-chat" onClick={handleBackToList}>
                <ArrowLeft size={24} />
              </button>
              <div className="chat-header-info">
                <div className="chat-avatar">
                  <div className="avatar-placeholder">{selectedChat.name[0]}</div>
                </div>
                <div className="chat-header-details">
                  <h3>{selectedChat.name}</h3>
                  <span className="chat-status">в сети</span>
                </div>
              </div>
              <button className="menu-btn-chat"><MoreVertical size={20} /></button>
            </div>

            <div className="chat-messages">
              {messages[selectedChat.id]?.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.isOwn ? 'message-own' : 'message-other'}`}
                >
                  <div className="message-bubble">
                    <div className="message-text">{msg.text}</div>
                    <div className="message-time">{msg.time}</div>
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
              />
              <button className="send-btn" onClick={handleSendMessage}>
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