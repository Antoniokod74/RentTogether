import React from 'react';
import { Shield, UserCheck, CreditCard, CheckCircle, Star } from 'lucide-react';
import './BecomePartner.css';

const BecomePartner = () => {
  const benefits = [
    {
      id: 1,
      title: "Полная защита",
      description: "Ваш автомобиль застрахован на весь период аренды",
      feature: "100% страховка",
      icon: <Shield className="benefit-icon" />
    },
    {
      id: 2,
      title: "Проверенные арендаторы",
      description: "Все клиенты проходят верификацию и проверку документов",
      feature: "Проверка ID",
      icon: <UserCheck className="benefit-icon" />
    },
    {
      id: 3,
      title: "Гарантия выплат",
      description: "Получайте оплату в течение 24 часов после завершения аренды. Без задержек и скрытых комиссий.",
      feature: "Без задержек",
      icon: <CreditCard className="benefit-icon" />
    }
  ];

  const stats = [
    { value: "1,200+", label: "Активных автомобилей" },
    { value: "₽32,000", label: "Средний доход в месяц" },
    { value: "4.8/5", label: "Рейтинг партнеров" }
  ];

  return (
    <section className="become-partner">
      <div className="container">
        <div className="partner-header">
          <h2>Сдавайте свой автомобиль и зарабатывайте</h2>
          <p className="partner-subtitle">
            Превратите свой автомобиль в источник дохода!<br />
            Присоединяйтесь к нашей платформе и зарабатывайте, когда ваша машина простаивает.
          </p>
        </div>

        <div className="partner-content">
          <div className="benefits-section">
            <div className="benefits-grid">
              {benefits.map((benefit) => (
                <div key={benefit.id} className="benefit-card">
                  <div className="benefit-icon-wrapper">
                    {benefit.icon}
                  </div>
                  <div className="benefit-content">
                    <h3 className="benefit-title">{benefit.title}</h3>
                    <p className="benefit-description">{benefit.description}</p>
                    <div className="benefit-feature">
                      <CheckCircle className="feature-check" />
                      <span>{benefit.feature}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="earn-steps">
              <h3>Как начать зарабатывать</h3>
              <div className="steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Регистрация</h4>
                    <p>Заполните простую форму и загрузите документы на автомобиль</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Проверка</h4>
                    <p>Наши специалисты проведут техосмотр и фотосессию вашего авто</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Заработок</h4>
                    <p>Получайте заявки от арендаторов и зарабатывайте деньги</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="partner-sidebar">
            <div className="income-card">
              <h3>Стабильный доход</h3>
              <p className="income-amount">Зарабатывайте до 50,000₽ в месяц</p>
              <p className="income-note">сдавая свой автомобиль в аренду</p>
              
              <div className="schedule-info">
                <h4>Гибкий график</h4>
                <p>Выбирайте удобное время для сдачи авто в аренду</p>
                <div className="availability">
                  <CheckCircle className="availability-check" />
                  <span>24/7 доступность</span>
                </div>
              </div>

              <button className="partner-btn primary">
                Стать партнером
              </button>
              <button className="partner-btn secondary">
                Рассчитать доход
              </button>
            </div>

            <div className="stats-card">
              <h3>Наши партнеры уже зарабатывают</h3>
              <div className="stats-grid">
                {stats.map((stat, index) => (
                  <div key={index} className="stat-item">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="star-icon" fill="currentColor" />
                  ))}
                </div>
                <span>Рейтинг партнеров</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BecomePartner;