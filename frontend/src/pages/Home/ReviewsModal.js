import React from 'react';
import { X } from 'lucide-react';
import './ReviewsModal.css';

const ReviewsModal = ({ isOpen, onClose }) => {
  const reviews = [
    {
      id: 1,
      name: "Анна Петрова",
      rating: 5,
      date: "15.01.2024",
      text: "Отличный сервис! Арендовала Toyota Camry на выходные. Машина в идеальном состоянии, весь процесс аренды занял 15 минут. Обязательно буду пользоваться снова!",
      car: "Toyota Camry"
    },
    {
      id: 2,
      name: "Иван Сидоров",
      rating: 5,
      date: "10.01.2024",
      text: "Пользуемся RentTogether уже полгода. Всегда нахожу подходящий автомобиль по адекватной цене. Поддержка работает оперативно, решают любые вопросы.",
      car: "Kia Rio"
    },
    {
      id: 3,
      name: "Мария Козлова",
      rating: 4,
      date: "05.01.2024",
      text: "Удобная платформа, понятный интерфейс. Единственное - хотелось бы больше автомобилей премиум-класса в наличии. В остальном всё отлично!",
      car: "BMW X3"
    },
    {
      id: 4,
      name: "Дмитрий Волков",
      rating: 5,
      date: "28.12.2023",
      text: "Лучший сервис аренды в Челябинске! Цены ниже чем у конкурентов, а качество обслуживания на высоте. Рекомендую всем знакомым.",
      car: "Hyundai Solaris"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Отзывы наших клиентов</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="reviews-stats">
          <div className="rating-overview">
            <div className="average-rating">
              <span className="rating-value">4.9</span>
              <span className="rating-max">/5</span>
            </div>
            <div className="rating-stars">★★★★★</div>
            <div className="reviews-count">На основе 2,347 отзывов</div>
          </div>
        </div>

        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.name}</span>
                  <span className="review-date">{review.date}</span>
                </div>
                <div className="review-rating">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
              </div>
              <p className="review-text">{review.text}</p>
              <div className="review-car">Арендовал(а): {review.car}</div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="add-review-btn">Оставить отзыв</button>
          <button className="see-all-reviews-btn">Смотреть все отзывы</button>
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;