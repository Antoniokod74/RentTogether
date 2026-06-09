import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import HowItWorks from './HowItWorks';
import InsuranceOptions from './InsuranceOptions';
import BecomePartner from './BecomePartner';
import SupportSection from './SupportSection';
import Footer from './Footer';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleFindCars = () => {
    navigate('/catalog');
  };

  const handleLearnMore = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="home-page">
      <Header />
      
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1>Аренда авто в Челябинске</h1>
            <p className="hero-subtitle">
              От людей для людей. Лучшие условия аренды, приятные цены и поддержка 24/7
            </p>
            
            <div className="hero-features">
              <div className="feature-item">
                <span className="feature-icon">📍</span>
                <span className="feature-text">По всему Челябинску</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">😊</span>
                <span className="feature-text">1000+ довольных клиентов</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🕒</span>
                <span className="feature-text">Поддержка 24/7</span>
              </div>
            </div>

            <div className="hero-buttons">
              <button className="btn-primary" onClick={handleFindCars}>
                Найти авто →
              </button>
              <button className="btn-secondary" onClick={handleLearnMore}>
                Узнать больше
              </button>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
      <InsuranceOptions />
      <BecomePartner />
      <SupportSection />
      <Footer />
    </div>
  );
};

export default Home;