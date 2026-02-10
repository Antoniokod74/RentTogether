import React, { useState } from 'react';
import { Phone, Mail, Clock } from 'lucide-react';
import './Footer.css';

// Импортируем готовые модальные окна
import { AboutCompanyModal, InsuranceModal, RequirementsModal, FAQModal } from './Modals';
import ReviewsModal from './ReviewsModal';

const Footer = () => {
  const [activeModal, setActiveModal] = useState(null);

  const services = [
    "Эконом авто",
    "Комфорт авто", 
    "Премиум авто",
    "Долгосрочная аренда",
    "Доставка авто"
  ];

  const information = [
    "О компании",
    "Отзывы",
    "Страхование",
    "Требования к арендаторам"
  ];

  const handleLinkClick = (section) => {
    switch(section) {
      case "О компании":
        setActiveModal('about');
        break;
      case "Отзывы":
        setActiveModal('reviews');
        break;
      case "Страхование":
        setActiveModal('insurance');
        break;
      case "Требования к арендаторам":
        setActiveModal('requirements');
        break;
      case "Часто задаваемые вопросы":
        setActiveModal('faq');
        break;
      default:
        console.log(`Переход к разделу: ${section}`);
    }
  };

  const handleDocumentDownload = (docType, e) => {
    e.preventDefault();
    
    const documents = {
      privacy: {
        url: '/documents/privacy-policy.pdf',
        filename: 'Политика_конфиденциальности_RentTogether.pdf'
      },
      terms: {
        url: '/documents/terms-of-use.pdf', 
        filename: 'Условия_использования_RentTogether.pdf'
      }
    };

    const doc = documents[docType];
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Основной контент футера */}
          <div className="footer-main">
            <div className="footer-grid">
              {/* Компания и контакты */}
              <div className="footer-column">
                <div className="footer-section">
                  <h3 className="logo">RentTogether</h3>
                </div>
                <div className="footer-section">
                  <p className="company-description">
                    Агрегатор аренды автомобилей в Челябинске. От людей для людей. 
                    Лучшие условия аренды, приятные цены и поддержка 24/7.
                  </p>
                </div>
                <div className="footer-section">
                  <div className="contact-info">
                    <div className="contact-item">
                      <Phone className="contact-icon" />
                      <span>+7 (351) 200-30-40</span>
                    </div>
                    <div className="contact-item">
                      <Mail className="contact-icon" />
                      <span>support@renttogether.ru</span>
                    </div>
                    <div className="contact-item">
                      <Clock className="contact-icon" />
                      <span>Поддержка 24/7</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Услуги */}
              <div className="footer-column">
                <div className="footer-section">
                  <h4 className="section-title">Услуги</h4>
                  <ul className="section-links">
                    {services.map((service, index) => (
                      <li key={index}>
                        <button 
                          className="footer-link"
                          onClick={() => handleLinkClick(service)}
                        >
                          {service}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Информация */}
              <div className="footer-column">
                <div className="footer-section">
                  <h4 className="section-title">Информация</h4>
                  <ul className="section-links">
                    {information.map((info, index) => (
                      <li key={index}>
                        <button 
                          className="footer-link"
                          onClick={() => handleLinkClick(info)}
                        >
                          {info}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Помощь */}
              <div className="footer-column">
                <div className="footer-section">
                  <h4 className="section-title">Помощь</h4>
                  <ul className="section-links">
                    <li>
                      <button 
                        className="footer-link"
                        onClick={() => handleLinkClick('Часто задаваемые вопросы')}
                      >
                        Часто задаваемые вопросы
                      </button>
                    </li>
                    <li>
                      <button 
                        className="footer-link"
                        onClick={(e) => handleDocumentDownload('privacy', e)}
                      >
                        Политика конфиденциальности
                      </button>
                    </li>
                    <li>
                      <button 
                        className="footer-link"
                        onClick={(e) => handleDocumentDownload('terms', e)}
                      >
                        Условия использования
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Разделитель */}
          <div className="footer-divider"></div>

          {/* Нижняя часть футера */}
          <div className="footer-bottom">
            <div className="bottom-content">
              <p className="copyright">
                © 2025 RentTogether. Все права защищены.
              </p>
              <div className="legal-links">
                <button 
                  className="legal-link"
                  onClick={(e) => handleDocumentDownload('privacy', e)}
                >
                  Политика конфиденциальности
                </button>
                <button 
                  className="legal-link"
                  onClick={(e) => handleDocumentDownload('terms', e)}
                >
                  Условия использования
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальные окна */}
      <AboutCompanyModal 
        isOpen={activeModal === 'about'} 
        onClose={() => setActiveModal(null)} 
      />
      
      <ReviewsModal 
        isOpen={activeModal === 'reviews'} 
        onClose={() => setActiveModal(null)} 
      />
      
      <InsuranceModal 
        isOpen={activeModal === 'insurance'} 
        onClose={() => setActiveModal(null)} 
      />
      
      <RequirementsModal 
        isOpen={activeModal === 'requirements'} 
        onClose={() => setActiveModal(null)} 
      />
      
      <FAQModal 
        isOpen={activeModal === 'faq'} 
        onClose={() => setActiveModal(null)} 
      />
    </footer>
  );
};

export default Footer;