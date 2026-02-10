import React from 'react';
import { Shield, ShieldCheck, ShieldPlus, Phone } from 'lucide-react';
import './InsuranceOptions.css';

const InsuranceOptions = () => {
  const insurancePlans = [
    {
      id: 1,
      title: "Стандартная страховка",
      price: "Включена",
      description: "Стандартное покрытие для спокойной поездки",
      features: [
        "ОСАГО на весь период аренды",
        "Франшиза 15,000 ₽",
        "Ущерб третьим лицам",
        "Техническая поломка авто",
        "Круглосуточная поддержка"
      ],
      icon: <Shield className="insurance-icon" />,
      included: true,
      buttonText: "Уже включена"
    },
    {
      id: 2,
      title: "Расширенная страховка",
      price: "от 490 ₽/сутки",
      description: "Дополнительная защита от непредвиденных ситуаций",
      features: [
        "Снижение франшизы до 5,000 ₽",
        "Страхование от угона",
        "Повреждение стекол и фар",
        "Ущерб салону автомобиля",
        "Эвакуатор без доплат"
      ],
      icon: <ShieldCheck className="insurance-icon" />,
      included: false,
      buttonText: "Выбрать страховку"
    },
    {
      id: 3,
      title: "Полная защита",
      price: "от 890 ₽/сутки",
      description: "Максимальное покрытие для полного спокойствия",
      features: [
        "Нулевая франшиза",
        "Полное КАСКО покрытие",
        "Страхование личных вещей",
        "Компенсация простоя",
        "Подменный автомобиль",
        "Юридическая поддержка"
      ],
      icon: <ShieldPlus className="insurance-icon" />,
      included: false,
      buttonText: "Выбрать страховку"
    }
  ];

  return (
    <section className="insurance-options">
      <div className="container">
        <div className="section-header">
          <h2>Варианты страхования</h2>
          <p className="section-subtitle">
            Выберите уровень страхового покрытия для максимального спокойствия во время поездки
          </p>
          <div className="divider"></div>
        </div>

        <div className="insurance-grid">
          {insurancePlans.map((plan) => (
            <div key={plan.id} className={`insurance-card ${plan.included ? 'included' : ''}`}>
              <div className="insurance-header">
                <div className="insurance-icon-wrapper">
                  {plan.icon}
                </div>
                <div className="insurance-title-price">
                  <h3 className="insurance-title">{plan.title}</h3>
                  <span className="insurance-price">{plan.price}</span>
                </div>
              </div>
              
              <p className="insurance-description">{plan.description}</p>
              
              <ul className="insurance-features">
                {plan.features.map((feature, index) => (
                  <li key={index} className="feature-item">
                    <span className="check-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button className={`select-insurance-btn ${plan.included ? 'included' : ''}`}>
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="consultation-section">
          <div className="consultation-content">
            <Phone className="consultation-icon" />
            <div className="consultation-text">
              <h4>Нужна консультация по выбору страховки?</h4>
              <p>Наши специалисты помогут подобрать оптимальный вариант</p>
            </div>
            <button className="consultation-btn">
              Получить консультацию
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InsuranceOptions;