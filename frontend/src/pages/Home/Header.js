import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReviewsModal from './ReviewsModal';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsMenuOpen(false);
  };

  const handleCarsClick = () => {
    navigate('/catalog');
    setIsMenuOpen(false);
  };

  const handleHowItWorksClick = () => {
    scrollToSection('how-it-works');
  };

  const handleReviewsClick = () => {
    setIsReviewsModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleContactsClick = () => {
    scrollToSection('contacts');
  };

  const handleLogoClick = () => {
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleLoginClick = () => {
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleRegisterClick = () => {
    navigate('/register');
    setIsMenuOpen(false);
  };

  // Новая функция для кнопки "Сдать авто"
  const handleAddCarClick = () => {
    navigate('/add-car');
    setIsMenuOpen(false);
  };

  const handleProfileMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setIsProfileMenuOpen(true);
  };

  const handleProfileMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsProfileMenuOpen(false);
    }, 800);
    setCloseTimeout(timeout);
  };

  const handleMenuMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setIsProfileMenuOpen(true);
  };

  const handleMenuMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsProfileMenuOpen(false);
    }, 800);
    setCloseTimeout(timeout);
  };

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleProfileMenuClick = () => {
    navigate('/profile');
    setIsProfileMenuOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="logo" onClick={handleLogoClick} style={{cursor: 'pointer'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <img 
                src="/logo.png" 
                alt="RentTogether"
                style={{width: '45px', height: '70px'}}
              />
              <h1 style={{margin: 0}}>RentTogether</h1>
            </div>
          </div>

          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <button 
              className="nav-link"
              onClick={handleHowItWorksClick}
            >
              Как работает
            </button>
            <button 
              className="nav-link"
              onClick={handleCarsClick}
            >
              Автомобили
            </button>
            {user && (
              <button 
                className="nav-link"
                onClick={handleAddCarClick}
              >
                Сдать авто
              </button>
            )}
            <button 
              className="nav-link"
              onClick={handleReviewsClick}
            >
              Отзывы
            </button>
            <button 
              className="nav-link"
              onClick={handleContactsClick}
            >
              Контакты
            </button>
          </nav>

          <div className="auth-buttons">
            {user ? (
              <div className="user-menu-wrapper">
                {/* Кнопка "Сдать авто" для десктопа */}
                <button 
                  className="add-car-btn"
                  onClick={handleAddCarClick}
                >
                  <Plus size={16} />
                  Сдать авто
                </button>

                {/* Профиль пользователя */}
                <div 
                  className="profile-menu"
                  onMouseEnter={handleProfileMouseEnter}
                  onMouseLeave={handleProfileMouseLeave}
                >
                  <button className="profile-btn">
                    <User size={20} />
                    <span className="profile-name">{user.firstName}</span>
                  </button>
                  
                  {isProfileMenuOpen && (
                    <div 
                      className="profile-dropdown"
                      onMouseEnter={handleMenuMouseEnter}
                      onMouseLeave={handleMenuMouseLeave}
                    >
                      <button 
                        className="dropdown-item"
                        onClick={handleProfileMenuClick}
                      >
                        <User size={16} />
                        Мой профиль
                      </button>
                      <button 
                        className="dropdown-item logout-btn"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} />
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button className="btn-login" onClick={handleLoginClick}>
                  Войти
                </button>
                <button className="btn-register" onClick={handleRegisterClick}>
                  Регистрация
                </button>
              </>
            )}
          </div>

          <button 
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <ReviewsModal 
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
      />
    </>
  );
};

export default Header;