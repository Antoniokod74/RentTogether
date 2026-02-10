const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Получаем токен из заголовка
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Токен отсутствует. Доступ запрещен.' });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Находим пользователя
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден. Токен невалиден.' });
    }

    // Добавляем пользователя в запрос
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Невалидный токен' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истек' });
    }
    
    res.status(500).json({ error: 'Ошибка сервера при аутентификации' });
  }
};

module.exports = auth;