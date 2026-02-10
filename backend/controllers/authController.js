import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;

  try {
    // Проверяем есть ли пользователь
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Создаем пользователя
    const newUser = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, first_name, last_name, phone, created_at`,
      [email, passwordHash, firstName, lastName, phone]
    );

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: newUser.rows[0].id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        firstName: newUser.rows[0].first_name,
        lastName: newUser.rows[0].last_name,
        phone: newUser.rows[0].phone
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Находим пользователя
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user.rows[0].id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Успешный вход',
      token,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        firstName: user.rows[0].first_name,
        lastName: user.rows[0].last_name,
        phone: user.rows[0].phone
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};