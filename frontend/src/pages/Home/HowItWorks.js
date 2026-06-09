import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HowItWorks.css';

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      id: 1,
      title: "Выберите автомобиль",
      description: "Подберите подходящий автомобиль из нашего каталога по параметрам: класс, марка, тип топлива и другим характеристикам.",
      icon: "🚗",
      features: ["Доступно 500+ автомобилей", "Фильтры по параметрам", "Фотографии и описание"]
    },
    {
      id: 2,
      title: "Забронируйте онлайн",
      description: "Забронируйте выбранный автомобиль через сайт или приложение. Укажите даты аренды и дополнительные услуги.",
      icon: "📱",
      features: ["Онлайн-бронирование", "Выбор дат аренды", "Дополнительные услуги"]
    },
    {
      id: 3,
      title: "Подтверждение брони",
      description: "Наш менеджер свяжется с вами для подтверждения бронирования и уточнения деталей заказа.",
      icon: "✅",
      features: ["Быстрое подтверждение", "Уточнение деталей", "Поддержка менеджера"]
    },
    {
      id: 4,
      title: "Оплатите аренду",
      description: "Оплатите аренду удобным способом: банковской картой, онлайн-переводом или наличными при получении.",
      icon: "💳",
      features: ["Банковские карты", "Онлайн-переводы", "Наличные при получении"]
    },
    {
      id: 5,
      title: "Получите автомобиль",
      description: "Получите автомобиль в удобной локации в Челябинске. Проведем осмотр и подпишем договор аренды.",
      icon: "🔑",
      features: ["Удобные локации", "Осмотр автомобиля", "Подписание договора"]
    },
    {
      id: 6,
      title: "Наслаждайтесь поездкой",
      description: "Отправляйтесь в путь! Наслаждайтесь комфортной поездкой с полной страховкой и поддержкой 24/7.",
      icon: "🛣️",
      features: ["Полная страховка", "Поддержка 24/7", "Комфортная поездка"]
    }
  ];

  const handleGoToCatalog = () => {
    navigate('/catalog');
  };

  return (
    <section id="how-it-works" className="how-it-works">
      <div className="container">
        <div className="section-header">
          <h2>Как это работает</h2>
          <p className="section-subtitle">
            Всего 6 простых шагов чтобы арендовать автомобиль в Челябинске<br />
            Быстро, удобно и безопасно
          </p>
          <div className="divider"></div>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={step.id} className="step-card">
              <div className="step-header">
                <div className="step-number-wrapper">
                  <span className="step-number">{index + 1}</span>
                </div>
                <div className="step-icon-wrapper">
                  <span className="step-icon">{step.icon}</span>
                </div>
              </div>
              
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              
              <ul className="step-features">
                {step.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="step-feature-item">
                    <span className="check-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="how-it-works-footer">
          <div className="footer-content">
            <div className="footer-icon">🚀</div>
            <div className="footer-text">
              <h3>Готовы начать?</h3>
              <p>Выберите автомобиль и начните процесс аренды прямо сейчас</p>
            </div>
            <button className="cta-button" onClick={handleGoToCatalog}>
              Перейти к каталогу
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;