import React from 'react';
import { X } from 'lucide-react';


const AboutCompanyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>О компании RentTogether</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="company-info">
            <div className="info-section">
              <h3>Наша миссия</h3>
              <p>Сделать аренду автомобилей доступной, безопасной и удобной для всех жителей Челябинска и области.</p>
            </div>
            
            <div className="info-section">
              <h3>Что мы предлагаем</h3>
              <ul className="features-list">
                <li>✓ Прозрачные условия аренды</li>
                <li>✓ Полная страховка автомобилей</li>
                <li>✓ Круглосуточная поддержка</li>
                <li>✓ Система рейтингов и отзывов</li>
                <li>✓ Быстрая бронь за 15 минут</li>
                <li>✓ Автомобили от проверенных владельцев</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>Наши преимущества</h3>
              <div className="advantages-grid">
                <div className="advantage-item">
                  <div className="advantage-value">500+</div>
                  <div className="advantage-label">автомобилей</div>
                </div>
                <div className="advantage-item">
                  <div className="advantage-value">24/7</div>
                  <div className="advantage-label">поддержка</div>
                </div>
                <div className="advantage-item">
                  <div className="advantage-value">98%</div>
                  <div className="advantage-label">довольных клиентов</div>
                </div>
                <div className="advantage-item">
                  <div className="advantage-value">15 мин</div>
                  <div className="advantage-label">максимальная бронь</div>
                </div>
              </div>
            </div>
            
            <div className="info-section">
              <h3>Контакты</h3>
              <div className="contact-details">
                <div className="contact-item">
                  <strong>Email:</strong> info@renttogether.ru
                </div>
                <div className="contact-item">
                  <strong>Телефон:</strong> +7 (351) 200-30-40
                </div>
                <div className="contact-item">
                  <strong>Адрес:</strong> Челябинск, ул. Ленина, 123
                </div>
                <div className="contact-item">
                  <strong>Режим работы:</strong> Круглосуточно
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InsuranceModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Страхование автомобилей</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="insurance-info">
            <div className="info-section">
              <h3>Обязательное страхование</h3>
              <p>Все автомобили на платформе застрахованы по <strong>ОСАГО</strong> - это обязательное условие для размещения автомобиля в аренду.</p>
            </div>
            
            <div className="info-section">
              <h3>Дополнительная защита</h3>
              <div className="protection-list">
                <div className="protection-item">
                  <div className="protection-icon">🛡️</div>
                  <div className="protection-content">
                    <h4>Страхование от угона и ущерба</h4>
                    <p>Полное покрытие в случае угона или повреждения автомобиля</p>
                  </div>
                </div>
                <div className="protection-item">
                  <div className="protection-icon">🚫</div>
                  <div className="protection-content">
                    <h4>Защита от несанкционированного использования</h4>
                    <p>Контроль доступа и мониторинг использования автомобиля</p>
                  </div>
                </div>
                <div className="protection-item">
                  <div className="protection-icon">👥</div>
                  <div className="protection-content">
                    <h4>Страхование гражданской ответственности</h4>
                    <p>Защита ваших интересов в случае ДТП по вине арендатора</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="info-section">
              <h3>Процесс страхового случая</h3>
              <div className="process-steps">
                <div className="process-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Немедленно сообщите</h4>
                    <p>Свяжитесь со службой поддержки в течение 15 минут</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Оформите документы</h4>
                    <p>Вызовите ГИБДД и составьте все необходимые документы</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Предоставьте документы</h4>
                    <p>Передайте полный комплект документов страховой компании</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Получите выплату</h4>
                    <p>Страховая компания производит выплату в течение 14 дней</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequirementsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Требования к арендаторам</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="requirements-info">
            <div className="info-section">
              <h3>Основные требования</h3>
              <div className="requirements-list">
                <div className="requirement-item">
                  <div className="requirement-icon">🎂</div>
                  <div className="requirement-content">
                    <h4>Возраст от 21 года</h4>
                    <p>Минимальный возраст для аренды автомобиля</p>
                  </div>
                </div>
                <div className="requirement-item">
                  <div className="requirement-icon">📄</div>
                  <div className="requirement-content">
                    <h4>Действующее водительское удостоверение</h4>
                    <p>Российские права категории B или международные</p>
                  </div>
                </div>
                <div className="requirement-item">
                  <div className="requirement-icon">⏱️</div>
                  <div className="requirement-content">
                    <h4>Стаж вождения от 2 лет</h4>
                    <p>Подтвержденный опыт управления автомобилем</p>
                  </div>
                </div>
                <div className="requirement-item">
                  <div className="requirement-icon">💳</div>
                  <div className="requirement-content">
                    <h4>Чистая кредитная история</h4>
                    <p>Отсутствие просрочек и финансовых нарушений</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="info-section">
              <h3>Необходимые документы</h3>
              <ul className="documents-list">
                <li>• Паспорт гражданина РФ</li>
                <li>• Водительское удостоверение</li>
                <li>• Второй документ удостоверения личности (загранпаспорт, военный билет)</li>
                <li>• ИНН (по требованию)</li>
              </ul>
            </div>
            
            <div className="info-section">
              <h3>Ограничения</h3>
              <div className="restrictions">
                <div className="restriction-item">
                  <div className="restriction-badge">🚫</div>
                  <span>Не более 2 нарушений ПДД за последний год</span>
                </div>
                <div className="restriction-item">
                  <div className="restriction-badge">🚫</div>
                  <span>Отсутствие серьезных ДТП по вине арендатора</span>
                </div>
                <div className="restriction-item">
                  <div className="restriction-badge">🚫</div>
                  <span>Нет ограничений по медицинским показаниям</span>
                </div>
                <div className="restriction-item">
                  <div className="restriction-badge">🚫</div>
                  <span>Отсутствие административных правонарушений</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FAQModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  const faqItems = [
    {
      question: "Как арендовать автомобиль?",
      answer: "Выберите автомобиль в каталоге, укажите даты аренды, заполните заявку с вашими данными и дождитесь подтверждения от владельца. Весь процесс занимает не более 15 минут."
    },
    {
      question: "Какие документы нужны для аренды?",
      answer: "Для аренды потребуется паспорт гражданина РФ, действующее водительское удостоверение и второй документ удостоверения личности. Все документы проверяются онлайн."
    },
    {
      question: "Что входит в стоимость аренды?",
      answer: "Стоимость включает аренду автомобиля, страховку ОСАГО, комиссию сервиса и техническую поддержку 24/7. Дополнительно оплачивается топливо и платные дороги."
    },
    {
      question: "Как происходит оплата?",
      answer: "Оплата осуществляется онлайн через защищенную платежную систему. Мы принимаем банковские карты Visa, MasterCard, Мир, а также электронные кошельки."
    },
    {
      question: "Можно ли отменить бронь?",
      answer: "Да, вы можете отменить бронь бесплатно за 24 часа до начала аренды. При отмене позднее этого срока удерживается частичная стоимость."
    },
    {
      question: "Что делать в случае ДТП?",
      answer: "Немедленно свяжитесь со службой поддержки, вызовите ГИБДД для оформления документов и следуйте инструкциям нашего оператора."
    }
  ];
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Часто задаваемые вопросы</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="faq-list">
            {faqItems.map((item, index) => (
              <div key={index} className="faq-item">
                <h3 className="faq-question">{item.question}</h3>
                <p className="faq-answer">{item.answer}</p>
              </div>
            ))}
          </div>
          
          <div className="support-notice">
            <p>Не нашли ответ на свой вопрос? Наша служба поддержки всегда готова помочь!</p>
            <div className="support-contacts">
              <strong>Телефон:</strong> +7 (351) 200-30-40<br/>
              <strong>Email:</strong> support@renttogether.ru<br/>
              <strong>Режим работы:</strong> Круглосуточно
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AboutCompanyModal, InsuranceModal, RequirementsModal, FAQModal };