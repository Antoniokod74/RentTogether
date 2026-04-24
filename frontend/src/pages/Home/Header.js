import React, { useState, useEffect, useRef } from 'react';
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
  const menuRef = useRef(null);

  // Закрытие меню при клике вне шапки
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Блокировка прокрутки страницы при открытом меню
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMenuOpen(false);
  };

  const handleCarsClick = () => {
    navigate('/catalog');
    setIsMenuOpen(false);
  };

  const handleHowItWorksClick = () => scrollToSection('how-it-works');
  const handleReviewsClick = () => {
    setIsReviewsModalOpen(true);
    setIsMenuOpen(false);
  };
  const handleContactsClick = () => scrollToSection('contacts');
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
  const handleAddCarClick = () => {
    navigate('/add-car');
    setIsMenuOpen(false);
  };

  // Выпадающее меню профиля (оставляем без изменений)
  const handleProfileMouseEnter = () => {
    if (closeTimeout) clearTimeout(closeTimeout);
    setIsProfileMenuOpen(true);
  };
  const handleProfileMouseLeave = () => {
    const timeout = setTimeout(() => setIsProfileMenuOpen(false), 800);
    setCloseTimeout(timeout);
  };
  const handleMenuMouseEnter = () => {
    if (closeTimeout) clearTimeout(closeTimeout);
    setIsProfileMenuOpen(true);
  };
  const handleMenuMouseLeave = () => {
    const timeout = setTimeout(() => setIsProfileMenuOpen(false), 800);
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
      <header className="header" ref={menuRef}>
        <div className="header-container">
          <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/logo.png" alt="RentTogether" style={{ width: '45px', height: '70px' }} />
              <h1 style={{ margin: 0 }}>RentTogether</h1>
            </div>
          </div>

          {/* Бургер-кнопка */}
          <button className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Основное навигационное меню (для десктопа и мобильных) */}
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <button className="nav-link" onClick={handleHowItWorksClick}>Как работает</button>
            <button className="nav-link" onClick={handleCarsClick}>Автомобили</button>
            {user && <button className="nav-link" onClick={handleAddCarClick}>Сдать авто</button>}
            <button className="nav-link" onClick={handleReviewsClick}>Отзывы</button>
            <button className="nav-link" onClick={handleContactsClick}>Контакты</button>

            {/* Блок авторизации, который дублируется для мобильных версий */}
            <div className="mobile-auth-buttons">
              {user ? (
                <>
                  <button className="add-car-btn-mobile" onClick={handleAddCarClick}>
                    <Plus size={16} /> Сдать авто
                  </button>
                  <div className="profile-menu-mobile">
                    <div className="profile-info-mobile">
                      <User size={20} />
                      <span className="profile-name-mobile">{user.firstName}</span>
                    </div>
                    <button className="dropdown-item-mobile" onClick={handleProfileMenuClick}>
                      <User size={16} /> Мой профиль
                    </button>
                    <button className="dropdown-item-mobile logout-btn" onClick={handleLogout}>
                      <LogOut size={16} /> Выйти
                    </button>
                  </div>
                </>
              ) : (
                <div className="auth-buttons-mobile">
                  <button className="btn-login-mobile" onClick={handleLoginClick}>Войти</button>
                  <button className="btn-register-mobile" onClick={handleRegisterClick}>Регистрация</button>
                </div>
              )}
            </div>
          </nav>

          {/* Десктопные кнопки авторизации (скрываются на мобильных) */}
          <div className="auth-buttons desktop-only">
            {user ? (
              <div className="user-menu-wrapper">
                <button className="add-car-btn" onClick={handleAddCarClick}>
                  <Plus size={16} /> Сдать авто
                </button>
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
                      <button className="dropdown-item" onClick={handleProfileMenuClick}>
                        <User size={16} /> Мой профиль
                      </button>
                      <button className="dropdown-item logout-btn" onClick={handleLogout}>
                        <LogOut size={16} /> Выйти
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button className="btn-login" onClick={handleLoginClick}>Войти</button>
                <button className="btn-register" onClick={handleRegisterClick}>Регистрация</button>
              </>
            )}
          </div>
        </div>
      </header>

      <ReviewsModal isOpen={isReviewsModalOpen} onClose={() => setIsReviewsModalOpen(false)} />
    </>
  );
};

export default Header;