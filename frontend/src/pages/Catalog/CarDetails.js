import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../Home/Header';
import Footer from '../Home/Footer';
import { 
  Car, Users, Fuel, Cog, Gauge, Palette, MapPin, Calendar, 
  FileText, ArrowLeft, X, ChevronLeft, ChevronRight, CreditCard,
  Phone, Calendar as CalendarIcon
} from 'lucide-react';
import './CarDetails.css';

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);

  // Состояния для модального окна бронирования
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Функция для нормализации даты
  const normalizeDate = (dateString) => {
    if (!dateString) return null;
    
    // Если дата в формате 'YYYY-MM-DD'
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      date.setHours(0, 0, 0, 0);
      return date;
    }
    
    // Если это ISO строка или другой формат
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return null;
    }
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Улучшенная функция проверки забронированных дат для отображения в календаре
  const isDateBooked = (date) => {
    if (!bookings || bookings.length === 0) return false;
    
    const checkDate = normalizeDate(date);
    if (!checkDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Не показываем прошедшие даты как занятые (для визуала)
    if (checkDate < today) return false;
    
    const isBooked = bookings.some(booking => {
      // В КАЛЕНДАРЕ показываем как занятые ВСЕ активные бронирования включая pending
      const activeStatuses = ['confirmed', 'active', 'paid', 'pending'];
      if (!activeStatuses.includes(booking.status)) return false;
      
      const startDate = normalizeDate(booking.start_date);
      const endDate = normalizeDate(booking.end_date);
      
      if (!startDate || !endDate) return false;
      
      return checkDate >= startDate && checkDate <= endDate;
    });
    
    return isBooked;
  };

  // Функция проверки доступности диапазона дат для бронирования
  const isDateRangeAvailable = (startDate, endDate) => {
    if (!bookings || bookings.length === 0) return true;
    
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    
    if (!start || !end) return false;
    
    // Проверяем каждую дату в диапазоне
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      if (isDateBookedForBooking(currentDate)) {
        return false;
      }
    }
    
    return true;
  };

  // Отдельная функция для проверки при бронировании (более строгая)
  const isDateBookedForBooking = (date) => {
    if (!bookings || bookings.length === 0) return false;
    
    const checkDate = normalizeDate(date);
    if (!checkDate) return false;
    
    return bookings.some(booking => {
      // При бронировании учитываем только подтвержденные/активные брони
      const validStatuses = ['confirmed', 'active', 'paid'];
      if (!validStatuses.includes(booking.status)) return false;
      
      const startDate = normalizeDate(booking.start_date);
      const endDate = normalizeDate(booking.end_date);
      
      if (!startDate || !endDate) return false;
      
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        setLoading(true);
        
        // Загружаем данные автомобиля
        const response = await fetch(`http://localhost:5000/api/cars/${id}`);
        if (!response.ok) {
          throw new Error('Ошибка загрузки данных автомобиля');
        }
        const data = await response.json();
        setCar(data.car);
        
        // Загружаем фотографии автомобиля
        const photosResponse = await fetch(`http://localhost:5000/api/cars/${id}/photos`);
        if (photosResponse.ok) {
          const photosData = await photosResponse.json();
          setPhotos(photosData.photos || []);
        }

        // Загружаем бронирования автомобиля
        const bookingsResponse = await fetch(`http://localhost:5000/api/cars/${id}/bookings`);
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          console.log('📅 Бронирования из API:', bookingsData.bookings);
          setBookings(bookingsData.bookings || []);
        } else {
          console.log('❌ Ошибка загрузки бронирований:', bookingsResponse.status);
          setBookings([]);
        }
        
      } catch (error) {
        console.error('Ошибка загрузки автомобиля:', error);
        setError('Не удалось загрузить данные автомобиля');
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [id]);

  // Отладочный эффект для проверки работы функций
  useEffect(() => {
    if (bookings.length > 0) {
      console.log('🔍 Проверка работы isDateBooked:');
      bookings.forEach((booking, index) => {
        console.log(`Бронирование ${index + 1}:`, {
          start_date: booking.start_date,
          end_date: booking.end_date,
          status: booking.status,
          isActive: ['confirmed', 'active', 'paid', 'pending'].includes(booking.status)
        });
      });
      
      // Проверим несколько дат
      const testDates = [
        new Date(),
        new Date(Date.now() + 86400000), // Завтра
        new Date(Date.now() + 172800000) // Послезавтра
      ];
      
      testDates.forEach(date => {
        console.log(`Дата ${date.toISOString().split('T')[0]}:`, {
          isDateBooked: isDateBooked(date),
          isDateBookedForBooking: isDateBookedForBooking(date)
        });
      });
    }
  }, [bookings]);

  const handleBack = () => {
    navigate('/catalog');
  };

  const getMainPhoto = () => {
    const mainPhoto = photos.find(photo => photo.is_main) || photos[0];
    return mainPhoto ? `http://localhost:5000${mainPhoto.photo_url}` : null;
  };

  const openPhotoViewer = (index) => {
    setSelectedPhotoIndex(index);
    setIsPhotoViewerOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closePhotoViewer = () => {
    setIsPhotoViewerOpen(false);
    setSelectedPhotoIndex(null);
    document.body.style.overflow = 'unset';
  };

  const nextPhoto = () => {
    setSelectedPhotoIndex((prevIndex) => 
      prevIndex === photos.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevPhoto = () => {
    setSelectedPhotoIndex((prevIndex) => 
      prevIndex === 0 ? photos.length - 1 : prevIndex - 1
    );
  };

  // Функции для работы с календарем
  const isDateSelected = (date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    const checkDate = normalizeDate(date);
    const start = normalizeDate(selectedStartDate);
    const end = normalizeDate(selectedEndDate);
    return checkDate >= start && checkDate <= end;
  };

  const handleDateClick = (date) => {
    const clickedDate = normalizeDate(date);
    if (!clickedDate) return;
    
    // Проверяем, не занята ли дата (для отображения в календаре)
    if (isDateBooked(clickedDate)) {
      return;
    }
    
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Начало нового выбора
      setSelectedStartDate(clickedDate);
      setSelectedEndDate(null);
    } else if (clickedDate > selectedStartDate) {
      // Завершение выбора диапазона
      setSelectedEndDate(clickedDate);
    } else if (clickedDate < selectedStartDate) {
      // Если кликнули дату раньше начальной, меняем начальную
      setSelectedStartDate(clickedDate);
      setSelectedEndDate(null);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthDays = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];

    // Пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Дни текущего месяца
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Расчет общей стоимости
  const calculateTotalPrice = () => {
    if (!selectedStartDate || !selectedEndDate) return 0;
    const start = normalizeDate(selectedStartDate);
    const end = normalizeDate(selectedEndDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days * car.daily_price;
  };

  // Функция открытия модального окна бронирования
  const openBookingModal = () => {
    if (!selectedStartDate || !selectedEndDate) {
      alert('Пожалуйста, выберите даты аренды');
      return;
    }
    
    // Проверяем доступность дат ДЛЯ БРОНИРОВАНИЯ (строгая проверка)
    if (!isDateRangeAvailable(selectedStartDate, selectedEndDate)) {
      alert('В выбранном диапазоне есть занятые даты. Пожалуйста, выберите другие даты.');
      return;
    }
    
    setIsBookingModalOpen(true);
  };

  // Функция закрытия модального окна
  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setPaymentMethod('card');
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setPhoneNumber('');
    setIsSubmitting(false);
    setBookingSuccess(false);
  };

  // Функция отправки бронирования
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStartDate || !selectedEndDate) {
      alert('Пожалуйста, выберите даты аренды');
      return;
    }

    // Финальная проверка перед отправкой
    if (!isDateRangeAvailable(selectedStartDate, selectedEndDate)) {
      alert('К сожалению, выбранные даты стали недоступны. Пожалуйста, выберите другие даты.');
      return;
    }

    setIsSubmitting(true);

    try {
      const start = normalizeDate(selectedStartDate);
      const end = normalizeDate(selectedEndDate);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      const totalPrice = totalDays * car.daily_price;

      const bookingData = {
        car_id: car.id,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        total_days: totalDays,
        total_price: totalPrice,
        payment_intent_id: `temp_${Date.now()}`
      };

      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка бронирования');
      }

      const result = await response.json();
      console.log('✅ Бронирование создано:', result.booking);
      
      setBookingSuccess(true);
      
      // Обновляем список бронирований
      const bookingsResponse = await fetch(`http://localhost:5000/api/cars/${id}/bookings`);
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.bookings || []);
      }
      
      // Увеличил время показа уведомления до 7 секунд
      setTimeout(() => {
        closeBookingModal();
        // Редирект на страницу профиля с активной вкладкой "Мои поездки"
        navigate('/profile?tab=bookings');
      }, 7000);

    } catch (error) {
      console.error('❌ Ошибка бронирования:', error);
      alert(`Ошибка бронирования: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Функция форматирования карты
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    return parts.length ? parts.join(' ') : value;
  };

  // Функция форматирования срока действия
  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  // Закрытие по ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.keyCode === 27) {
        if (isPhotoViewerOpen) {
          closePhotoViewer();
        } else if (isBookingModalOpen) {
          closeBookingModal();
        }
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isPhotoViewerOpen, isBookingModalOpen]);

  if (loading) {
    return (
      <div className="car-details-page">
        <Header />
        <div className="loading">Загрузка данных автомобиля...</div>
        <Footer />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="car-details-page">
        <Header />
        <div className="error-message">
          {error || 'Автомобиль не найден'}
        </div>
        <Footer />
      </div>
    );
  }

  const mainPhoto = getMainPhoto();
  const monthDays = getMonthDays(currentYear, currentMonth);
  const totalPrice = calculateTotalPrice();
  const totalDays = selectedStartDate && selectedEndDate 
    ? Math.ceil((normalizeDate(selectedEndDate) - normalizeDate(selectedStartDate)) / (1000 * 60 * 60 * 24)) + 1 
    : 0;

  // Получаем сегодняшнюю дату для сравнения
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="car-details-page">
      <Header />
      
      <div className="container">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
          Назад к каталогу
        </button>

        <div className="car-details">
          <div className="car-gallery">
            <div 
              className="main-image" 
              onClick={() => mainPhoto && openPhotoViewer(0)}
              style={{ cursor: mainPhoto ? 'pointer' : 'default' }}
            >
              {mainPhoto ? (
                <img src={mainPhoto} alt={`${car.brand} ${car.model}`} />
              ) : (
                <div className="car-placeholder">🚗</div>
              )}
            </div>
            
            {photos.length > 1 && (
              <div className="photo-thumbnails">
                <h3>Все фотографии</h3>
                <div className="thumbnails-grid">
                  {photos.map((photo, index) => (
                    <div 
                      key={photo.id} 
                      className="thumbnail-item"
                      onClick={() => openPhotoViewer(index)}
                    >
                      <img 
                        src={`http://localhost:5000${photo.photo_url}`} 
                        alt={`${car.brand} ${car.model} ${index + 1}`}
                      />
                      {photo.is_main && <div className="main-indicator">Главная</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Календарь бронирования */}
            <div className="booking-calendar">
              <h3>📅 Выберите даты аренды</h3>
              
              <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={prevMonth}>
                  <ChevronLeft size={20} />
                </button>
                <div className="calendar-month">
                  {monthNames[currentMonth]} {currentYear}
                </div>
                <button className="calendar-nav-btn" onClick={nextMonth}>
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="calendar-grid">
                {dayNames.map(day => (
                  <div key={day} className="calendar-day-header">{day}</div>
                ))}
                
                {monthDays.map((date, index) => {
                  if (!date) {
                    return <div key={index} className="calendar-day empty"></div>;
                  }

                  const normalizedDate = normalizeDate(date);
                  const isToday = normalizedDate && normalizedDate.getTime() === today.getTime();
                  const isPast = normalizedDate && normalizedDate < today;
                  const isBooked = isDateBooked(date); // Для отображения в календаре
                  const isSelected = isDateSelected(date);
                  const isStart = selectedStartDate && normalizedDate && normalizedDate.getTime() === normalizeDate(selectedStartDate).getTime();
                  const isEnd = selectedEndDate && normalizedDate && normalizedDate.getTime() === normalizeDate(selectedEndDate).getTime();

                  return (
                    <div
                      key={index}
                      className={`calendar-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''} ${isStart ? 'start-date' : ''} ${isEnd ? 'end-date' : ''}`}
                      onClick={() => !isPast && !isBooked && handleDateClick(date)}
                      title={isBooked ? 'Эта дата занята' : isPast ? 'Прошедшая дата' : ''}
                    >
                      {date.getDate()}
                      {isBooked && <div className="booked-indicator" title="Занято"></div>}
                    </div>
                  );
                })}
              </div>

              {/* Легенда календаря */}
              <div className="calendar-legend">
                <div className="legend-item">
                  <div className="legend-color available"></div>
                  <span>Свободно</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color booked"></div>
                  <span>Занято</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color selected"></div>
                  <span>Выбрано</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color today"></div>
                  <span>Сегодня</span>
                </div>
              </div>
            </div>
          </div>

          <div className="car-info">
            <div className="car-header">
              <h1>{car.brand} {car.model}</h1>
              <p className="car-year">{car.year} год • {car.category}</p>
            </div>
            
            <div className="price-section">
              <div className="daily-price">{car.daily_price} ₽/сутки</div>
              {car.is_available ? (
                <span className="available-badge">
                  <div className="status-dot"></div>
                  Доступен для аренды
                </span>
              ) : (
                <span className="unavailable-badge">
                  <div className="status-dot"></div>
                  Не доступен
                </span>
              )}
            </div>

            {/* Блок с выбранными датами и стоимостью */}
            {(selectedStartDate && selectedEndDate) && (
              <div className="booking-summary">
                <h4>Ваше бронирование</h4>
                <div className="booking-dates">
                  <div className="date-range">
                    <Calendar size={16} />
                    {selectedStartDate.toLocaleDateString('ru-RU')} - {selectedEndDate.toLocaleDateString('ru-RU')}
                  </div>
                  <div className="days-count">{totalDays} {totalDays === 1 ? 'день' : totalDays < 5 ? 'дня' : 'дней'}</div>
                </div>
                <div className="price-breakdown">
                  <div className="price-item">
                    <span>{car.daily_price} ₽ × {totalDays} {totalDays === 1 ? 'день' : totalDays < 5 ? 'дня' : 'дней'}</span>
                    <span>{totalPrice} ₽</span>
                  </div>
                </div>
                <div className="total-price">
                  <span>Итого:</span>
                  <span className="total-amount">{totalPrice} ₽</span>
                </div>
              </div>
            )}

            <div className="specs-grid">
              <div className="spec-item">
                <Fuel size={20} />
                <div>
                  <span className="spec-label">Топливо</span>
                  <span className="spec-value">{car.fuel_type}</span>
                </div>
              </div>
              
              <div className="spec-item">
                <Cog size={20} />
                <div>
                  <span className="spec-label">Трансмиссия</span>
                  <span className="spec-value">{car.transmission}</span>
                </div>
              </div>
              
              <div className="spec-item">
                <Users size={20} />
                <div>
                  <span className="spec-label">Мест</span>
                  <span className="spec-value">{car.seats}</span>
                </div>
              </div>
              
              <div className="spec-item">
                <Car size={20} />
                <div>
                  <span className="spec-label">Дверей</span>
                  <span className="spec-value">{car.doors}</span>
                </div>
              </div>
              
              <div className="spec-item">
                <Gauge size={20} />
                <div>
                  <span className="spec-label">Расход</span>
                  <span className="spec-value">{car.fuel_consumption} л/100км</span>
                </div>
              </div>
              
              <div className="spec-item">
                <Palette size={20} />
                <div>
                  <span className="spec-label">Цвет</span>
                  <span className="spec-value">{car.color}</span>
                </div>
              </div>
            </div>

            <div className="detailed-specs">
              <div className="spec-group">
                <h3><Car size={20} /> Двигатель</h3>
                <div className="spec-details">
                  <div className="spec-detail">
                    <span className="detail-label">Объем двигателя</span>
                    <span className="detail-value">{car.engine_capacity} л</span>
                  </div>
                  <div className="spec-detail">
                    <span className="detail-label">Мощность</span>
                    <span className="detail-value">{car.horsepower} л.с.</span>
                  </div>
                </div>
              </div>

              <div className="spec-group">
                <h3><FileText size={20} /> Документы</h3>
                <div className="spec-details">
                  <div className="spec-detail">
                    <span className="detail-label">Госномер</span>
                    <span className="detail-value">{car.license_plate}</span>
                  </div>
                  {car.vin && (
                    <div className="spec-detail">
                      <span className="detail-label">VIN</span>
                      <span className="detail-value">{car.vin}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="spec-group">
                <h3><MapPin size={20} /> Местоположение</h3>
                <div className="spec-details">
                  <div className="spec-detail">
                    <span className="detail-value address">{car.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {car.description && (
              <div className="description-section">
                <h3>Описание</h3>
                <div className="description-content">
                  <p>{car.description}</p>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button 
                className="rent-now-btn"
                disabled={!car.is_available || !selectedStartDate || !selectedEndDate}
                onClick={openBookingModal}
              >
                {car.is_available 
                  ? (selectedStartDate && selectedEndDate ? 'Перейти к бронированию' : 'Выберите даты аренды')
                  : 'Не доступен для аренды'
                }
              </button>
              <button className="contact-btn">
                Связаться с владельцем
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно просмотра фотографий */}
      {isPhotoViewerOpen && selectedPhotoIndex !== null && (
        <div className="photo-viewer-overlay" onClick={closePhotoViewer}>
          <div className="photo-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closePhotoViewer}>
              <X size={24} />
            </button>
            
            <button className="nav-btn prev-btn" onClick={prevPhoto}>
              <ChevronLeft size={32} />
            </button>
            
            <div className="photo-container">
              <img 
                src={`http://localhost:5000${photos[selectedPhotoIndex].photo_url}`} 
                alt={`${car.brand} ${car.model} ${selectedPhotoIndex + 1}`}
              />
            </div>
            
            <button className="nav-btn next-btn" onClick={nextPhoto}>
              <ChevronRight size={32} />
            </button>
            
            <div className="photo-counter">
              {selectedPhotoIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно бронирования */}
      {isBookingModalOpen && (
        <div className="booking-modal-overlay" onClick={closeBookingModal}>
          <div className="booking-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeBookingModal}>
              <X size={24} />
            </button>
            
            <div className="booking-modal-header">
              <h2>Оформление бронирования</h2>
              <div className="car-info-summary">
                <div className="car-title">{car.brand} {car.model}</div>
                <div className="booking-dates">
                  <CalendarIcon size={16} />
                  {selectedStartDate.toLocaleDateString('ru-RU')} - {selectedEndDate.toLocaleDateString('ru-RU')}
                </div>
                <div className="booking-price">
                  Итого: {calculateTotalPrice()} ₽
                </div>
              </div>
            </div>

            {!bookingSuccess ? (
              <form onSubmit={handleBookingSubmit} className="booking-form">
                <div className="payment-method-selector">
                  <h3>Способ оплаты</h3>
                  <div className="payment-methods">
                    <label className="payment-method-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <CreditCard size={20} />
                      <span>Банковская карта</span>
                    </label>
                    
                    <label className="payment-method-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="sbp"
                        checked={paymentMethod === 'sbp'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <Phone size={20} />
                      <span>СБП (Система быстрых платежей)</span>
                    </label>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="card-payment-form">
                    <div className="form-group">
                      <label>Номер карты</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        required
                      />
                    </div>
                    
                    <div className="card-details">
                      <div className="form-group">
                        <label>Срок действия</label>
                        <input
                          type="text"
                          placeholder="ММ/ГГ"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          maxLength={5}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>CVC</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                          maxLength={3}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'sbp' && (
                  <div className="sbp-payment-form">
                    <div className="form-group">
                      <label>Номер телефона</label>
                      <input
                        type="tel"
                        placeholder="+7 (999) 999-99-99"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                      <p className="sbp-hint">
                        На этот номер будет отправлена ссылка для оплаты через СБП
                      </p>
                    </div>
                  </div>
                )}

                <div className="booking-terms">
                  <label className="terms-checkbox">
                    <input type="checkbox" required />
                    <span>Я соглашаюсь с условиями аренды и политикой конфиденциальности</span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="submit-booking-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Обработка...' : `Оплатить ${calculateTotalPrice()} ₽`}
                </button>
              </form>
            ) : (
              <div className="booking-success">
                <div className="success-icon">✅</div>
                <h3>Бронирование успешно создано!</h3>
                <p>Через 7 секунд вы будете перенаправлены в ваш профиль, во вкладку "Мои поездки"</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CarDetails;