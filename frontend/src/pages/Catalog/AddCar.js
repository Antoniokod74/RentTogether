import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../Home/Header';
import Footer from '../Home/Footer';
import { Car, Fuel, Cog, Users, DoorOpen, Gauge, Palette, DollarSign, FileText, Upload, X, Image } from 'lucide-react';
import './AddCar.css';

const AddCar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    vin: '',
    color: '',
    category: 'Седан',
    seats: 5,
    doors: 4,
    fuel_type: 'Бензин',
    transmission: 'Автомат',
    fuel_consumption: '',
    engine_capacity: '',
    horsepower: '',
    description: '',
    daily_price: '',
    address: '',
    car_class: 'Эконом' // ДОБАВИЛ СЮДА
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + photos.length > 10) {
      alert('Максимальное количество фотографий - 10');
      return;
    }

    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      is_main: photos.length === 0,
      display_order: photos.length
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setPhotos(prev => {
      const newPhotos = prev.filter((_, i) => i !== index);
      if (prev[index].is_main && newPhotos.length > 0) {
        newPhotos[0].is_main = true;
      }
      return newPhotos;
    });
  };

  const setMainPhoto = (index) => {
    setPhotos(prev => 
      prev.map((photo, i) => ({
        ...photo,
        is_main: i === index
      }))
    );
  };

  const uploadPhotos = async (carId) => {
    const formData = new FormData();
    
    photos.forEach((photo, index) => {
      formData.append('photos', photo.file);
      formData.append('is_main', photo.is_main ? 'true' : 'false');
      formData.append('display_order', index.toString());
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/cars/${carId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Ошибка загрузки фотографий');
    }

    return await response.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const carResponse = await fetch('http://localhost:5000/api/cars', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!carResponse.ok) {
        const errorData = await carResponse.json();
        throw new Error(errorData.error || 'Ошибка добавления автомобиля');
      }

      const carData = await carResponse.json();
      const carId = carData.car.id;

      if (photos.length > 0) {
        await uploadPhotos(carId);
      }

      alert('Автомобиль успешно добавлен!');
      navigate('/catalog');
      
    } catch (error) {
      console.error('Ошибка добавления автомобиля:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="add-car-page">
        <Header />
        <div className="container">
          <div className="error-message">
            Пожалуйста, войдите в систему чтобы добавить автомобиль
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="add-car-page">
      <Header />
      
      <div className="container">
        <div className="add-car-container">
          <h1>Добавить автомобиль в аренду</h1>
          <p>Заполните информацию о вашем автомобиле</p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="add-car-form">
            <div className="form-section">
              <h3><Image size={20} /> Фотографии автомобиля</h3>
              
              <div className="photos-upload">
                <div className="upload-area">
                  <input
                    type="file"
                    id="car-photos"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="file-input"
                  />
                  <label htmlFor="car-photos" className="upload-label">
                    <Upload size={24} />
                    <span>Добавить фотографии</span>
                    <small>Максимум 10 фото, первая будет главной</small>
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="photos-preview">
                    <h4>Загруженные фото ({photos.length}/10)</h4>
                    <div className="photos-grid">
                      {photos.map((photo, index) => (
                        <div key={index} className={`photo-item ${photo.is_main ? 'main-photo' : ''}`}>
                          <img src={photo.preview} alt={`Preview ${index + 1}`} />
                          <div className="photo-actions">
                            <button
                              type="button"
                              className="action-btn main-btn"
                              onClick={() => setMainPhoto(index)}
                              title="Сделать главной"
                            >
                              {photo.is_main ? '★' : '☆'}
                            </button>
                            <button
                              type="button"
                              className="action-btn remove-btn"
                              onClick={() => removePhoto(index)}
                              title="Удалить"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          {photo.is_main && <div className="main-badge">Главная</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3><Car size={20} /> Основная информация</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Марка *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                    placeholder="Toyota"
                  />
                </div>
                <div className="form-group">
                  <label>Модель *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    required
                    placeholder="Camry"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Год выпуска *</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                    min="1990"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="form-group">
                  <label>Госномер *</label>
                  <input
                    type="text"
                    name="license_plate"
                    value={formData.license_plate}
                    onChange={handleInputChange}
                    required
                    placeholder="А123БВ77"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Класс автомобиля *</label>
                  <select
                    name="car_class"
                    value={formData.car_class}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Эконом">Эконом</option>
                    <option value="Комфорт">Комфорт</option>
                    <option value="Премиум">Премиум</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Цвет *</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    required
                    placeholder="Черный"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3><Cog size={20} /> Технические характеристики</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Топливо *</label>
                  <select
                    name="fuel_type"
                    value={formData.fuel_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Бензин">Бензин</option>
                    <option value="Дизель">Дизель</option>
                    <option value="Электро">Электро</option>
                    <option value="Гибрид">Гибрид</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Коробка передач *</label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Автомат">Автомат</option>
                    <option value="Механика">Механика</option>
                    <option value="Робот">Робот</option>
                    <option value="Вариатор">Вариатор</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Объем двигателя (л) *</label>
                  <input
                    type="number"
                    step="0.1"
                    name="engine_capacity"
                    value={formData.engine_capacity}
                    onChange={handleInputChange}
                    required
                    placeholder="2.0"
                  />
                </div>
                <div className="form-group">
                  <label>Мощность (л.с.) *</label>
                  <input
                    type="number"
                    name="horsepower"
                    value={formData.horsepower}
                    onChange={handleInputChange}
                    required
                    placeholder="150"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Расход топлива (л/100км)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="fuel_consumption"
                    value={formData.fuel_consumption}
                    onChange={handleInputChange}
                    placeholder="8.5"
                  />
                </div>
                <div className="form-group">
                  <label>Категория</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="Седан">Седан</option>
                    <option value="Хэтчбек">Хэтчбек</option>
                    <option value="Универсал">Универсал</option>
                    <option value="Внедорожник">Внедорожник</option>
                    <option value="Кроссовер">Кроссовер</option>
                    <option value="Минивэн">Минивэн</option>
                    <option value="Купе">Купе</option>
                    <option value="Кабриолет">Кабриолет</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3><Users size={20} /> Комфорт и цена</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Количество мест *</label>
                  <input
                    type="number"
                    name="seats"
                    value={formData.seats}
                    onChange={handleInputChange}
                    required
                    min="2"
                    max="9"
                  />
                </div>
                <div className="form-group">
                  <label>Количество дверей *</label>
                  <input
                    type="number"
                    name="doors"
                    value={formData.doors}
                    onChange={handleInputChange}
                    required
                    min="2"
                    max="6"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Адрес автомобиля *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Город, улица, дом"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><DollarSign size={16} /> Стоимость аренды (₽/сутки) *</label>
                  <input
                    type="number"
                    name="daily_price"
                    value={formData.daily_price}
                    onChange={handleInputChange}
                    required
                    placeholder="2500"
                    min="500"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label><FileText size={16} /> Описание</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Опишите особенности вашего автомобиля..."
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => navigate('/catalog')}
              >
                Отмена
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Добавление...
                  </>
                ) : (
                  'Добавить автомобиль'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AddCar;