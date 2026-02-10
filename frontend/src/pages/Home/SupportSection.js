import React from 'react';
import { Phone, MessageCircle, Mail, MapPin, Clock, Star, CheckCircle } from 'lucide-react';
import './SupportSection.css';

const SupportSection = () => {
  const contacts = [
    {
      id: 1,
      icon: <Phone className="contact-icon" />,
      title: "Телефон",
      value: "+7 (351) 200-30-40",
      availability: "24/7",
      buttonText: "Позвонить",
      type: "phone"
    },
    {
      id: 2,
      icon: <MessageCircle className="contact-icon" />,
      title: "Telegram",
      value: "@RentTogetherBot",
      availability: "24/7",
      buttonText: "Написать",
      type: "telegram"
    },
    {
      id: 3,
      icon: <Mail className="contact-icon" />,
      title: "Email",
      value: "support@renttogether.ru",
      availability: "Ответ в течение часа",
      buttonText: "Отправить",
      type: "email"
    }
  ];

  const supportFeatures = [
  {
    id: 1,
    title: "Быстрый ответ",
    description: "Среднее время ответа - 3 минуты",
    details: "Наша команда поддержки работает в режиме 24/7 и готова мгновенно ответить на ваш запрос. Независимо от времени суток, вы получите квалифицированную помощь в течение нескольких минут."
  },
  {
    id: 2,
    title: "Помощь на дороге", 
    description: "Эвакуатор и техническая помощь",
    details: "В случае поломки или аварии мы организуем эвакуатор, техническую помощь на месте или подменный автомобиль. Наша сеть партнеров охватывает весь Челябинск и область."
  },
  {
    id: 3,
    title: "Решение проблем",
    description: "100% решенных обращений", 
    details: "Мы гарантируем решение любой проблемы, связанной с арендой автомобиля. От вопросов по бронированию до сложных технических ситуаций - мы берем на себя полную ответственность."
  }
];

  return (
    <section id="contacts" className="support-section">
      <div className="container">
        <div className="support-header">
          <h2>Всегда готовы помочь</h2>
          <p className="support-subtitle">
            Наша команда поддержки работает круглосуточно, чтобы решить любые вопросы по аренде автомобилей. 
            Мы гарантируем быстрый ответ и профессиональную помощь.
          </p>
        </div>

        <div className="support-content">
          <div className="contacts-section">
            <div className="contacts-grid">
              {contacts.map((contact) => (
                <div key={contact.id} className="contact-card">
                  <div className="contact-header">
                    <div className="contact-icon-wrapper">
                      {contact.icon}
                    </div>
                    <div className="contact-info">
                      <h3 className="contact-title">{contact.title}</h3>
                      <p className="contact-value">{contact.value}</p>
                      <div className="contact-availability">
                        <Clock className="availability-icon" />
                        <span>{contact.availability}</span>
                      </div>
                    </div>
                  </div>
                  <button className={`contact-btn ${contact.type}`}>
                    {contact.buttonText}
                  </button>
                </div>
              ))}
            </div>

            <div className="emergency-actions">
              <button className="emergency-btn">
                <MapPin className="emergency-icon" />
                Экстренная помощь
              </button>
            </div>
          </div>

          <div className="support-stats">
            <div className="stats-card">
              <h3>24/7 Поддержка</h3>
              <div className="features-list">
                {supportFeatures.map((feature) => (
                    <div key={feature.id} className="feature-item">
                    <CheckCircle className="feature-check" />
                    <div className="feature-content">
                        <h4>{feature.title}</h4>
                        <p className="feature-description">{feature.description}</p>
                        <p className="feature-details">{feature.details}</p>
                    </div>
                    </div>
                ))}
                </div>
              
              <div className="rating-section">
                <div className="rating-value">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="star-icon" fill="currentColor" />
                    ))}
                  </div>
                  <span className="rating-text">4,9/5</span>
                </div>
                <p className="rating-subtitle">Основан на 2,347 отзывах клиентов</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SupportSection;