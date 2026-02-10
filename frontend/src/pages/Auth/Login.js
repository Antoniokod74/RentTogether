import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Header from '../Home/Header';
import './Login.css'; // Импортируем Login.css

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
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
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка входа');
    }

    console.log('Успешный вход:', data);
    
    // Сохраняем пользователя и токен в localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Переходим на главную
    navigate('/');

  } catch (error) {
    console.error('Ошибка входа:', error);
    setErrors({ submit: error.message || 'Неверный email или пароль' });
  } finally {
    setIsLoading(false);
  }
};

  const handleSocialLogin = (provider) => {
    console.log(`Вход через ${provider}`);
    // Здесь будет интеграция с социальными сетями
  };

  return (
    <div className="auth-page">
      <Header />
      
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Вход в аккаунт</h1>
          <p className="auth-subtitle">Войдите чтобы продолжить</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="auth-error">{errors.submit}</div>
          )}

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
              <Mail className="input-icon" size={20} />
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
              <Lock className="input-icon" size={20} />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <span className="auth-error">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>

          <div className="forgot-password">
            <Link to="/forgot-password" className="forgot-link">
              Забыли пароль?
            </Link>
          </div>

          <div className="auth-divider">
            <span>или</span>
          </div>

          <div className="social-buttons">
            <button
              type="button"
              className="social-btn"
              onClick={() => handleSocialLogin('Google')}
            >
              <img src="/icons/google.svg" alt="Google" className="social-icon" />
              Продолжить с Google
            </button>
            <button
              type="button"
              className="social-btn"
              onClick={() => handleSocialLogin('VK')}
            >
              <img src="/icons/vk.svg" alt="VK" className="social-icon" />
              Продолжить с VK
            </button>
          </div>

          <div className="auth-footer">
            Нет аккаунта?{' '}
            <Link to="/register" className="auth-link">
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;