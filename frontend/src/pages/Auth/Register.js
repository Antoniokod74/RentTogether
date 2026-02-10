import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import Header from '../Home/Header';
import './Register.css';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен';
    } else if (formData.phone.replace(/\D/g, '').length !== 11) {
      newErrors.phone = 'Номер должен содержать 11 цифр';
    }

    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Необходимо согласие с условиями';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setIsLoading(true);

  try {
    // Отправляем данные на бэкенд
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка регистрации');
    }

    console.log('Успешная регистрация:', data);
    
    // Сохраняем пользователя и токен в localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Переходим на главную
    navigate('/');

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    setErrors({ submit: error.message || 'Произошла ошибка. Попробуйте снова.' });
  } finally {
    setIsLoading(false);
  }
};

  const handleSocialRegister = (provider) => {
    console.log(`Регистрация через ${provider}`);
  };

  return (
    <div className="register-page">
      <Header />
      
      <div className="register-container">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-title">Регистрация</h1>
            <p className="auth-subtitle">Создайте аккаунт чтобы начать</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {errors.submit && (
              <div className="auth-error">{errors.submit}</div>
            )}

            <div className="form-group">
              <label className="form-label">Имя</label>
              <div className="form-input-wrapper">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Введите ваше имя"
                />
                <User className="input-icon" size={16} />
              </div>
              {errors.firstName && <span className="auth-error">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Фамилия</label>
              <div className="form-input-wrapper">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Введите вашу фамилию"
                />
                <User className="input-icon" size={16} />
              </div>
              {errors.lastName && <span className="auth-error">{errors.lastName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Телефон</label>
              <div className="form-input-wrapper">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="+7 (999) 123-45-67"
                />
                <Phone className="input-icon" size={16} />
              </div>
              {errors.phone && <span className="auth-error">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="form-input-wrapper">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="your@email.com"
                />
                <Mail className="input-icon" size={16} />
              </div>
              {errors.email && <span className="auth-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Пароль</label>
              <div className="form-input-wrapper password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Введите пароль"
                />
                <Lock className="input-icon" size={16} />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="auth-error">{errors.password}</span>}
            </div>

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="checkbox-input"
              />
              <label className="checkbox-label">
                Я соглашаюсь с{' '}
                <a 
                  href="/documents/terms-of-use.pdf" 
                  className="checkbox-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  условиями использования
                </a>{' '}
                и{' '}
                <a 
                  href="/documents/privacy-policy.pdf" 
                  className="checkbox-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  политикой конфиденциальности
                </a>
              </label>
              {errors.agreeToTerms && <span className="auth-error">{errors.agreeToTerms}</span>}
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>

            <div className="auth-divider">
              <span>или</span>
            </div>

            <div className="social-buttons">
              <button
                type="button"
                className="social-btn"
                onClick={() => handleSocialRegister('Google')}
              >
                <img src="/icons/google.svg" alt="Google" className="social-icon" />
                Продолжить с Google
              </button>
              <button
                type="button"
                className="social-btn"
                onClick={() => handleSocialRegister('VK')}
              >
                <img src="/icons/vk.svg" alt="VK" className="social-icon" />
                Продолжить с VK
              </button>
            </div>

            <div className="auth-footer">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="auth-link">
                Войти
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;