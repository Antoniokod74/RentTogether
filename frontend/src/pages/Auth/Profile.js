import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Mail, Phone, Calendar, MapPin, Car, Star, Settings, 
  Edit, AlertTriangle, FileText, MapPin as MapPinIcon, 
  Loader2, Users, Download
} from 'lucide-react';
import Header from '../Home/Header';
import './Profile.css';

const Profile = () => {
  const { user: authUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    driverLicense: '',
    driverLicenseIssueDate: '',
    driverLicenseExpiry: '',
    address: '',
    passportNumber: ''
  });
  const [isRentalReady, setIsRentalReady] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [downloadingContracts, setDownloadingContracts] = useState({});
  
  // Функция для скачивания договора в PDF
  const downloadContract = async (bookingId) => {
    try {
      // Показываем индикатор загрузки
      setDownloadingContracts(prev => ({ ...prev, [bookingId]: true }));
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Токен отсутствует. Пожалуйста, войдите снова.');
      }

      // Формируем URL для скачивания PDF договора
      const url = `/api/contracts/booking/${bookingId}/download`;
      console.log('📥 Скачивание договора по URL:', url);
      
      // Используем fetch для скачивания PDF
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });
      
      console.log('📋 Статус ответа:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка ответа:', errorText);
        
        // Попробуем получить JSON ошибку если есть
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
        } catch {
          throw new Error(`Ошибка скачивания: ${response.status} ${response.statusText}`);
        }
      }
      
      // Проверяем что это PDF
      const contentType = response.headers.get('content-type');
      console.log('📄 Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/pdf')) {
        const text = await response.text();
        console.error('❌ Ответ не PDF:', text.substring(0, 200));
        throw new Error('Сервер вернул не PDF документ');
      }
      
      // Получаем blob и создаем ссылку для скачивания
      const blob = await response.blob();
      console.log('📦 Размер PDF:', blob.size, 'байт');
      
      const urlObject = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlObject;
      link.download = `Договор_аренды_${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Очистка
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(urlObject);
      }, 100);
      
      // Показываем уведомление об успехе
      console.log('✅ Договор успешно скачан');
      alert('✅ Договор успешно скачан в формате PDF!');
      
    } catch (error) {
      console.error('❌ Ошибка скачивания договора:', error);
      
      let errorMessage = 'Не удалось скачать договор';
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else if (error.message.includes('401') || error.message.includes('токен')) {
        errorMessage = 'Ошибка авторизации. Пожалуйста, войдите снова.';
        localStorage.removeItem('token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        errorMessage = error.message;
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      // Скрываем индикатор загрузки
      setDownloadingContracts(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  // Функция выхода
  const handleLogout = () => {
    localStorage.removeItem('token');
    if (logout) {
      logout();
    }
    window.location.href = '/login';
  };

  // Функция проверки готовности к аренде
  const checkRentalReadiness = useCallback((data = formData) => {
    console.log('🔍 Проверка готовности к аренде...');
    
    const rentalRequirements = [
      'driverLicense',
      'driverLicenseIssueDate', 
      'driverLicenseExpiry',
      'dateOfBirth',
      'passportNumber'
    ];

    // Проверяем заполненность всех обязательных полей
    const allFieldsFilled = rentalRequirements.every(field => {
      const isFilled = data[field] && data[field].toString().trim() !== '';
      console.log(`Поле ${field}:`, data[field], 'Заполнено:', isFilled);
      return isFilled;
    });

    console.log('Все поля заполнены:', allFieldsFilled);

    // Проверка возраста (21+)
    let isAgeValid = false;
    if (data.dateOfBirth) {
      try {
        const birthDate = new Date(data.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        
        // Проверяем, был ли уже день рождения в этом году
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        isAgeValid = age >= 21;
        console.log('Возраст:', age, 'Достаточно лет (21+):', isAgeValid);
      } catch (error) {
        console.error('Ошибка расчета возраста:', error);
        isAgeValid = false;
      }
    } else {
      console.log('Дата рождения не указана');
    }

    const isReady = allFieldsFilled && isAgeValid;
    console.log('Готов к аренде:', isReady);
    
    setIsRentalReady(isReady);
    return isReady;
  }, [formData]);

  // Загрузка данных профиля
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Токен отсутствует');
        }

        const response = await fetch('/api/users/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }

        if (!response.ok) {
          throw new Error(`Ошибка загрузки профиля: ${response.status}`);
        }

        const data = await response.json();
        
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
          } catch (error) {
            console.error('Ошибка форматирования даты:', error);
            return '';
          }
        };

        const newFormData = {
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          dateOfBirth: formatDateForInput(data.user.dateOfBirth),
          driverLicense: data.user.driverLicense || '',
          driverLicenseIssueDate: formatDateForInput(data.user.driverLicenseIssueDate),
          driverLicenseExpiry: formatDateForInput(data.user.driverLicenseExpiry),
          address: data.user.address || '',
          passportNumber: data.user.passportNumber || ''
        };

        setFormData(newFormData);
        
        // Прямая проверка готовности
        const rentalRequirements = [
          'driverLicense',
          'driverLicenseIssueDate', 
          'driverLicenseExpiry',
          'dateOfBirth',
          'passportNumber'
        ];

        const allFieldsFilled = rentalRequirements.every(field => {
          return newFormData[field] && newFormData[field].toString().trim() !== '';
        });

        let isAgeValid = false;
        if (newFormData.dateOfBirth) {
          try {
            const birthDate = new Date(newFormData.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            
            isAgeValid = age >= 21;
          } catch (error) {
            console.error('Ошибка расчета возраста:', error);
            isAgeValid = false;
          }
        }

        setIsRentalReady(allFieldsFilled && isAgeValid);

      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        setFormData(prev => ({
          ...prev,
          firstName: authUser?.firstName || '',
          lastName: authUser?.lastName || '',
          email: authUser?.email || '',
          phone: authUser?.phone || ''
        }));
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser && !formData.firstName) {
      fetchProfile();
    } else if (!authUser) {
      setIsLoading(false);
    }
  }, [authUser, formData.firstName]);

  // Загрузка бронирований при переходе на вкладку "Мои поездки"
  useEffect(() => {
    const fetchBookings = async () => {
      if (activeTab === 'bookings') {
        setBookingsLoading(true);
        try {
          const token = localStorage.getItem('token');
          
          if (!token) {
            throw new Error('Токен отсутствует');
          }

          const response = await fetch('/api/bookings/my', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          }

          if (!response.ok) {
            throw new Error(`Ошибка загрузки бронирований: ${response.status}`);
          }

          const data = await response.json();
          console.log('📅 Загруженные бронирования:', data.bookings);
          setBookings(data.bookings || []);

        } catch (error) {
          console.error('Ошибка загрузки бронирований:', error);
          setBookings([]);
        } finally {
          setBookingsLoading(false);
        }
      }
    };

    fetchBookings();
  }, [activeTab]);

  // Проверяем готовность к аренде при изменении формы
  useEffect(() => {
    checkRentalReadiness();
  }, [formData, checkRentalReadiness]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Очищаем ошибку при изменении поля
    if (saveError) setSaveError('');
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    setSaveError('');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setSaveError('Токен отсутствует. Пожалуйста, войдите снова.');
        window.location.href = '/login';
        return;
      }

      // Валидация обязательных полей
      if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.email?.trim() || !formData.phone?.trim()) {
        setSaveError('Пожалуйста, заполните все обязательные поля (имя, фамилия, email, телефон)');
        return;
      }

      // Подготовка данных для отправки
      const requestData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth || null,
        driverLicense: formData.driverLicense?.trim() || '',
        driverLicenseIssueDate: formData.driverLicenseIssueDate || null,
        driverLicenseExpiry: formData.driverLicenseExpiry || null,
        address: formData.address?.trim() || '',
        passportNumber: formData.passportNumber?.trim() || ''
      };

      console.log('📤 Отправляемые данные:', requestData);

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      console.log('📥 Статус ответа:', response.status);

      if (response.status === 401) {
        localStorage.removeItem('token');
        setSaveError('Сессия истекла. Пожалуйста, войдите снова.');
        setTimeout(() => window.location.href = '/login', 2000);
        return;
      }

      if (!response.ok) {
        let errorMessage = `Ошибка сервера: ${response.status}`;
        
        try {
          const errorData = await response.json();
          console.log('Данные ошибки:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Ошибка парсинга ответа:', parseError);
          errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Успешный ответ:', data);
      
      // Обновляем данные формы после успешного сохранения
      setFormData(prev => ({
        ...prev,
        ...requestData
      }));
      
      // Проверяем готовность после сохранения
      setTimeout(() => {
        checkRentalReadiness();
        console.log('🔄 Проверка готовности после сохранения');
      }, 100);
      
      setIsEditing(false);
      setSaveError('');
      alert('Профиль успешно сохранен!');
      
    } catch (error) {
      console.error('❌ Полная ошибка сохранения:', error);
      
      let userErrorMessage = 'Ошибка при сохранении профиля';
      
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        userErrorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else if (error.message.includes('401') || error.message.includes('токен') || error.message.includes('аутентификац')) {
        userErrorMessage = 'Ошибка аутентификации. Пожалуйста, войдите снова.';
        localStorage.removeItem('token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        userErrorMessage = error.message;
      }
      
      setSaveError(userErrorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const getFieldClassName = (fieldName) => {
    const isEmpty = !formData[fieldName] || formData[fieldName].toString().trim() === '';
    const isRentalField = ['driverLicense', 'driverLicenseIssueDate', 'driverLicenseExpiry', 'dateOfBirth', 'passportNumber'].includes(fieldName);
    
    return `form-input ${isEmpty && isRentalField && !isRentalReady ? 'field-required' : ''}`;
  };

  // Функция для отображения статуса готовности
  const renderRentalStatus = () => {
    if (!isRentalReady) {
      const missingFields = [];
      
      if (!formData.driverLicense?.trim()) missingFields.push('водительские права');
      if (!formData.driverLicenseIssueDate?.trim()) missingFields.push('дата выдачи прав');
      if (!formData.driverLicenseExpiry?.trim()) missingFields.push('срок действия прав');
      if (!formData.dateOfBirth?.trim()) missingFields.push('дата рождения');
      if (!formData.passportNumber?.trim()) missingFields.push('паспортные данные');
      
      // Проверка возраста
      if (formData.dateOfBirth) {
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 21) {
          missingFields.push('возраст менее 21 года');
        }
      }

      return (
        <div className="rental-warning">
          <AlertTriangle size={16} />
          <div>
            <strong>Не готов к аренде</strong>
            <p>Заполните: {missingFields.join(', ')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="rental-ready-indicator">
        <Car size={16} />
        <div>
          <strong>Готов к аренде</strong>
          <p>Можно бронировать автомобили</p>
        </div>
      </div>
    );
  };

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return dateString;
    }
  };

  // Функция для получения статуса бронирования
  const getBookingStatus = (status) => {
    const statusMap = {
      'pending': { text: 'Ожидание', class: 'status-pending' },
      'confirmed': { text: 'Подтверждено', class: 'status-confirmed' },
      'active': { text: 'Активно', class: 'status-active' },
      'completed': { text: 'Завершено', class: 'status-completed' },
      'cancelled': { text: 'Отменено', class: 'status-cancelled' }
    };
    
    return statusMap[status] || { text: status, class: 'status-unknown' };
  };

  // Функция для отображения списка бронирований
  const renderBookings = () => {
    if (bookingsLoading) {
      return <div className="loading">Загрузка бронирований...</div>;
    }

    if (bookings.length === 0) {
      return (
        <div className="no-bookings">
          <Car size={48} />
          <p>У вас пока нет бронирований</p>
          <button 
            className="browse-cars-btn"
            onClick={() => window.location.href = '/catalog'}
          >
            Начать поиск автомобилей
          </button>
        </div>
      );
    }

    return (
      <div className="bookings-grid">
        {bookings.map((booking) => {
          const statusInfo = getBookingStatus(booking.status);
          
          return (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="car-info">
                  <h3>{booking.brand} {booking.model} ({booking.year})</h3>
                  <div className="car-specs-grid">
                    <span className="car-spec">
                      <Car size={14} /> {booking.category || 'Седан'}
                    </span>
                    <span className="car-spec">
                      <Users size={14} /> {booking.seats} мест
                    </span>
                    <span className="car-spec">
                      🚪 {booking.doors} двери
                    </span>
                    <span className="car-spec">
                      ⚙️ {booking.transmission}
                    </span>
                    <span className="car-spec">
                      ⛽ {booking.fuel_type}
                    </span>
                    {booking.engine_capacity && (
                      <span className="car-spec">
                        🔧 {booking.engine_capacity} л
                      </span>
                    )}
                    {booking.horsepower && (
                      <span className="car-spec">
                        💨 {booking.horsepower} л.с.
                      </span>
                    )}
                  </div>
                </div>
                <div className={`booking-status ${statusInfo.class}`}>
                  {statusInfo.text}
                </div>
              </div>
              
              <div className="booking-details">
                <div className="booking-section">
                  <h4>📅 Даты аренды</h4>
                  <div className="booking-dates-grid">
                    <div className="date-item">
                      <span className="date-label">Начало:</span>
                      <span className="date-value">{formatDate(booking.start_date)}</span>
                    </div>
                    <div className="date-item">
                      <span className="date-label">Окончание:</span>
                      <span className="date-value">{formatDate(booking.end_date)}</span>
                    </div>
                    <div className="date-item">
                      <span className="date-label">Дней:</span>
                      <span className="date-value highlight">{booking.total_days} {booking.total_days === 1 ? 'день' : booking.total_days < 5 ? 'дня' : 'дней'}</span>
                    </div>
                  </div>
                </div>

                <div className="booking-section">
                  <h4>📍 Местоположение</h4>
                  <div className="location-info">
                    <MapPinIcon size={16} />
                    <span className="address-text">{booking.address || 'Адрес не указан'}</span>
                  </div>
                </div>

                <div className="booking-section">
                  <h4>📝 Информация об автомобиле</h4>
                  <div className="car-details-grid">
                    <div className="car-detail">
                      <span className="detail-label">Госномер:</span>
                      <span className="detail-value highlight">{booking.license_plate || 'Не указан'}</span>
                    </div>
                    <div className="car-detail">
                      <span className="detail-label">Цвет:</span>
                      <span className="detail-value">{booking.color || 'Не указан'}</span>
                    </div>
                    {booking.vin && (
                      <div className="car-detail">
                        <span className="detail-label">VIN:</span>
                        <span className="detail-value">{booking.vin}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="booking-footer">
                <div className="booking-price-section">
                  <div className="price-details">
                    <div className="price-item">
                      <span className="price-label">Цена за сутки:</span>
                      <span className="price-value">{booking.daily_price} ₽</span>
                    </div>
                    <div className="price-item">
                      <span className="price-label">Количество дней:</span>
                      <span className="price-value">{booking.total_days}</span>
                    </div>
                    <div className="total-price-item">
                      <span className="total-label">Итого к оплате:</span>
                      <span className="total-amount">{booking.total_price} ₽</span>
                    </div>
                  </div>
                </div>
                <div className="booking-actions">
                  <button 
                    className="contract-btn"
                    onClick={() => downloadContract(booking.id)}
                    disabled={downloadingContracts[booking.id]}
                    title="Скачать договор аренды в PDF"
                  >
                    {downloadingContracts[booking.id] ? (
                      <>
                        <Loader2 size={16} className="spinner" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Скачать PDF
                      </>
                    )}
                  </button>
                  <button className="details-btn" onClick={() => window.location.href = `/car/${booking.car_id}`}>
                    Об автомобиле
                  </button>
                  <button className="support-btn">
                    Поддержка
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!authUser) {
    return (
      <div className="profile-page">
        <Header />
        <div className="profile-container">
          <div className="auth-required">
            <User size={48} />
            <h2>Требуется авторизация</h2>
            <p>Пожалуйста, войдите в систему для доступа к профилю</p>
            <button 
              className="login-btn"
              onClick={() => window.location.href = '/login'}
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="profile-page">
        <Header />
        <div className="profile-container">
          <div className="loading">
            <Loader2 size={32} className="spinner" />
            <p>Загрузка профиля...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />
      
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className={`profile-card ${!isRentalReady ? 'rental-not-ready' : 'rental-ready'}`}>
            <div className="profile-avatar">
              <User size={48} />
            </div>
            <h2 className="profile-name">{formData.firstName} {formData.lastName}</h2>
            <p className="profile-email">{formData.email}</p>
            
            {renderRentalStatus()}

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{bookings.length}</span>
                <span className="stat-label">Поездок</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">В избранном</span>
              </div>
              <div className="status-indicator">
                <div className={`status-dot ${isRentalReady ? 'ready' : 'not-ready'}`}></div>
                <span>{isRentalReady ? 'Доступен' : 'Не доступен'}</span>
              </div>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              Выйти из аккаунта
            </button>
          </div>

          <nav className="profile-nav">
            <button 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              Профиль
            </button>
            <button 
              className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <Car size={18} />
              Мои поездки
            </button>
            <button 
              className={`nav-item ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              <Star size={18} />
              Избранное
            </button>
            <button 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} />
              Настройки
            </button>
          </nav>
        </div>

        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="tab-header">
                <div>
                  <h2>Личная информация</h2>
                  {!isRentalReady && (
                    <p className="completion-notice">
                      Для бронирования автомобилей необходимо заполнить все обязательные поля
                    </p>
                  )}
                </div>
                <button 
                  className="edit-btn"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={saveLoading}
                >
                  <Edit size={16} />
                  {isEditing ? 'Отменить' : 'Редактировать'}
                </button>
              </div>

              {saveError && (
                <div className="error-message">
                  <AlertTriangle size={16} />
                  {saveError}
                </div>
              )}

              <div className="profile-form">
                <div className="form-section">
                  <h3 className="section-title">Основная информация</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <User size={16} />
                        Имя *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="form-input"
                        disabled={!isEditing || saveLoading}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        <User size={16} />
                        Фамилия *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="form-input"
                        disabled={!isEditing || saveLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Mail size={16} />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={!isEditing || saveLoading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Phone size={16} />
                      Телефон *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={!isEditing || saveLoading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Calendar size={16} />
                      Дата рождения *
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className={getFieldClassName('dateOfBirth')}
                      disabled={!isEditing || saveLoading}
                    />
                    <span className="field-hint">Для аренды необходимо быть старше 21 года</span>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">Документы для аренды</h3>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <FileText size={16} />
                      Паспортные данные *
                    </label>
                    <input
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleInputChange}
                      className={getFieldClassName('passportNumber')}
                      placeholder="Серия и номер паспорта"
                      disabled={!isEditing || saveLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Car size={16} />
                      Водительское удостоверение *
                    </label>
                    <input
                      type="text"
                      name="driverLicense"
                      value={formData.driverLicense}
                      onChange={handleInputChange}
                      className={getFieldClassName('driverLicense')}
                      placeholder="Серия и номер прав"
                      disabled={!isEditing || saveLoading}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <Calendar size={16} />
                        Дата выдачи прав *
                      </label>
                      <input
                        type="date"
                        name="driverLicenseIssueDate"
                        value={formData.driverLicenseIssueDate}
                        onChange={handleInputChange}
                        className={getFieldClassName('driverLicenseIssueDate')}
                        disabled={!isEditing || saveLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        <Calendar size={16} />
                        Срок действия *
                      </label>
                      <input
                        type="date"
                        name="driverLicenseExpiry"
                        value={formData.driverLicenseExpiry}
                        onChange={handleInputChange}
                        className={getFieldClassName('driverLicenseExpiry')}
                        disabled={!isEditing || saveLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">Дополнительная информация</h3>
                  <div className="form-group">
                    <label className="form-label">
                      <MapPin size={16} />
                      Адрес проживания
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Город, улица, дом"
                      disabled={!isEditing || saveLoading}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="form-actions">
                    <button 
                      className="save-btn" 
                      onClick={handleSaveProfile}
                      disabled={saveLoading}
                    >
                      {saveLoading ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => {
                        setIsEditing(false);
                        setSaveError('');
                      }}
                      disabled={saveLoading}
                    >
                      Отмена
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="tab-content">
              <div className="tab-header">
                <h2>Мои поездки</h2>
                <div className="bookings-info">
                  <p className="bookings-count">Всего бронирований: {bookings.length}</p>
                  {bookings.length > 0 && (
                    <p className="contracts-note">
                      💡 Нажмите "Скачать PDF" для получения договора аренды
                    </p>
                  )}
                </div>
              </div>
              {renderBookings()}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="tab-content">
              <h2>Избранные автомобили</h2>
              <div className="favorites-empty">
                <Star size={48} />
                <p>У вас пока нет избранных автомобилей</p>
                <button 
                  className="browse-cars-btn"
                  onClick={() => window.location.href = '/catalog'}
                >
                  Начать поиск
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="tab-content">
              <h2>Настройки аккаунта</h2>
              <div className="settings-list">
                <div className="setting-item">
                  <h3>Уведомления</h3>
                  <p>Настройте получение уведомлений о бронированиях</p>
                </div>
                <div className="setting-item">
                  <h3>Безопасность</h3>
                  <p>Изменить пароль и настройки безопасности</p>
                </div>
                <div className="setting-item">
                  <h3>Платежные методы</h3>
                  <p>Управление банковскими картами и платежами</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;