import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Home/Header';
import Footer from '../Home/Footer';
import './Catalog.css';

const Catalog = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    transmission: '',
    fuel_type: '',
    car_class: ''
  });
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/cars');
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки автомобилей');
        }

        const data = await response.json();
        setCars(data.cars || []);
      } catch (error) {
        console.error('Ошибка загрузки автомобилей:', error);
        setError('Не удалось загрузить автомобили');
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.transmission) queryParams.append('transmission', filters.transmission);
      if (filters.fuel_type) queryParams.append('fuel_type', filters.fuel_type);
      if (filters.car_class) queryParams.append('car_class', filters.car_class); // ДОБАВИЛ

      const response = await fetch(`/api/cars?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Ошибка поиска');
      }

      const data = await response.json();
      setCars(data.cars || []);
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setError('Ошибка при поиске автомобилей');
    } finally {
      setLoading(false);
    }
  };

  const getMainPhoto = (car) => {
    if (car.main_photo_url) {
      return `${car.main_photo_url}`;
    }
    return null;
  };

  const handleCarDetails = (carId) => {
    navigate(`/car/${carId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const toggleDescription = (carId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [carId]: !prev[carId]
    }));
  };

  const needsExpansion = (description) => {
    return description && description.length > 80;
  };

  // Функция для получения класса авто с иконкой
  const getCarClassIcon = (carClass) => {
    switch(carClass) {
      case 'Эконом': return '🚗';
      case 'Комфорт': return '🚙';
      case 'Премиум': return '🏎️';
      default: return '🚗';
    }
  };

  // Функция для получения стиля класса
  const getCarClassStyle = (carClass) => {
    switch(carClass) {
      case 'Эконом': return 'econom';
      case 'Комфорт': return 'comfort';
      case 'Премиум': return 'premium';
      default: return 'econom';
    }
  };

  const handleClearFilters = async () => {
    setFilters({
      search: '',
      transmission: '',
      fuel_type: '',
      car_class: ''
    });
    
    try {
      setLoading(true);
      const response = await fetch('/api/cars');
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки автомобилей');
      }

      const data = await response.json();
      setCars(data.cars || []);
    } catch (error) {
      console.error('Ошибка сброса фильтров:', error);
      setError('Ошибка при сбросе фильтров');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="catalog-page">
        <Header />
        <div className="loading">Загрузка автомобилей...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="catalog-page">
      <Header />
      
      <section className="catalog-hero">
        <div className="container">
          <h1>Каталог автомобилей</h1>
          <p>Выберите идеальный автомобиль для вашей поездки</p>
          
          <div className="search-filters">
            <input 
              type="text" 
              placeholder="Марка или модель" 
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <select 
              name="car_class"
              value={filters.car_class}
              onChange={handleFilterChange}
            >
              <option value="">Класс автомобиля</option>
              <option value="Эконом">🚗 Эконом</option>
              <option value="Комфорт">🚙 Комфорт</option>
              <option value="Премиум">🏎️ Премиум</option>
            </select>
            <select 
              name="transmission"
              value={filters.transmission}
              onChange={handleFilterChange}
            >
              <option value="">Тип трансмиссии</option>
              <option value="Автомат">Автомат</option>
              <option value="Механика">Механика</option>
              <option value="Робот">Робот</option>
              <option value="Вариатор">Вариатор</option>
            </select>
            <select 
              name="fuel_type"
              value={filters.fuel_type}
              onChange={handleFilterChange}
            >
              <option value="">Топливо</option>
              <option value="Бензин">Бензин</option>
              <option value="Дизель">Дизель</option>
              <option value="Электро">Электро</option>
              <option value="Гибрид">Гибрид</option>
            </select>
            
            <div className="filter-buttons">
              <button className="search-btn" onClick={handleSearch}>
                Найти
              </button>
              <button className="clear-btn" onClick={handleClearFilters}>
                Сбросить
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="catalog-results">
        <div className="container">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Статистика фильтров */}
          {filters.car_class && (
            <div className="active-filter">
              <span className="filter-tag">
                Класс: {filters.car_class} {getCarClassIcon(filters.car_class)}
                <button 
                  onClick={() => {
                    setFilters(prev => ({ ...prev, car_class: '' }));
                    handleSearch();
                  }}
                  className="remove-filter"
                >
                  ✕
                </button>
              </span>
            </div>
          )}

          {cars.length === 0 && !loading ? (
            <div className="no-cars">
              <p>Автомобили не найдены</p>
              <button className="clear-btn" onClick={handleClearFilters}>
                Показать все автомобили
              </button>
            </div>
          ) : (
            <div className="cars-grid">
              {cars.map((car) => {
                const mainPhoto = getMainPhoto(car);
                const isExpanded = expandedDescriptions[car.id];
                const shouldExpand = needsExpansion(car.description);
                
                return (
                  <div key={car.id} className="car-card">
                    <div className="car-image">
                      {mainPhoto ? (
                        <img 
                          src={mainPhoto} 
                          alt={`${car.brand} ${car.model}`}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div className={`car-placeholder ${mainPhoto ? 'hidden' : ''}`}>
                        🚗
                      </div>
                      
                      {/* Бейдж класса автомобиля */}
                      {car.car_class && (
                        <div className={`car-class-badge ${getCarClassStyle(car.car_class)}`}>
                          {getCarClassIcon(car.car_class)} {car.car_class}
                        </div>
                      )}
                    </div>
                    
                    <div className="car-info">
                      <div className="car-header">
                        <h3 className="car-title" style={{ color: '#ffffff' }}>{car.brand} {car.model}</h3>
                        <div className="car-header-right">
                          <span className="car-year">{car.year}</span>
                          {car.car_class && (
                            <span className={`car-class-small ${getCarClassStyle(car.car_class)}`}>
                              {getCarClassIcon(car.car_class)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="car-features">
                        <span className="car-feature">{car.transmission}</span>
                        <span className="car-feature">{car.fuel_type}</span>
                        <span className="car-feature">{car.seats} мест</span>
                      </div>

                      <div className="car-specs">
                        <div className="spec-item">
                          <span className="spec-label">Объем:</span>
                          <span className="spec-value">{car.engine_capacity} л</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Мощность:</span>
                          <span className="spec-value">{car.horsepower} л.с.</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Расход:</span>
                          <span className="spec-value">{car.fuel_consumption} л/100км</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Цвет:</span>
                          <span className="spec-value">{car.color}</span>
                        </div>
                      </div>

                      {car.description && (
                        <div 
                          className={`car-description ${shouldExpand ? 'expandable' : ''} ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => shouldExpand && toggleDescription(car.id)}
                          title={shouldExpand && !isExpanded ? "Нажмите для просмотра полного описания" : ""}
                        >
                          {isExpanded || !shouldExpand 
                            ? car.description 
                            : `${car.description.substring(0, 80)}...`
                          }
                        </div>
                      )}

                      <div className="car-footer">
                        <div className="car-price">
                          {formatPrice(car.daily_price)} ₽/сутки
                          {car.car_class && (
                            <span className={`price-badge ${getCarClassStyle(car.car_class)}`}>
                              {car.car_class}
                            </span>
                          )}
                        </div>
                        <div className="car-status">
                          {car.is_available ? (
                            <span className="status-available">Доступен</span>
                          ) : (
                            <span className="status-unavailable">Не доступен</span>
                          )}
                        </div>
                      </div>

                      <button 
                        className={`rent-btn ${!car.is_available ? 'disabled' : ''}`}
                        onClick={() => handleCarDetails(car.id)}
                        disabled={!car.is_available}
                      >
                        {car.is_available ? 'Арендовать' : 'Не доступен'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Catalog;