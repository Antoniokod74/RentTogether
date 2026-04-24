import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import expressRouterDiagram from 'express-router-diagram'; // добавлено для карты маршрутов
import { Server } from 'socket.io';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const PORT = process.env.PORT || 5000;

// Получаем __dirname для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontPath = path.join(__dirname, 'fonts', 'DejaVuSans.ttf');
console.log('🖋️ Путь к шрифту:', fontPath);

// Middleware
app.use(cors());
app.use(express.json());

// Создаем папку uploads если ее нет
const uploadsDir = path.join(__dirname, 'uploads', 'cars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Создана папка uploads/cars');
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения'), false);
    }
  }
});

// Статическая раздача файлов ДО других middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен отсутствует' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    req.userId = user.userId;
    next();
  });
};

// Test route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Регистрация пользователя
app.post('/api/auth/register', async (req, res) => {
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

    // Пока без хеширования пароля
    const newUser = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, first_name, last_name, phone, created_at`,
      [email, password, firstName, lastName, phone]
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
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// Логин пользователя
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    // Пока простая проверка пароля
    if (password !== user.rows[0].password_hash) {
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
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// Получение профиля пользователя
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('🔄 Получение профиля для пользователя:', userId);
    
    const user = await pool.query(
      `SELECT id, email, first_name, last_name, phone, date_of_birth, 
              driver_license_number, driver_license_issue_date, driver_license_expiry_date,
              address, passport_number, avatar_url, is_verified, is_active,
              created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    console.log('✅ Профиль найден:', user.rows[0].email);

    res.json({
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        firstName: user.rows[0].first_name,
        lastName: user.rows[0].last_name,
        phone: user.rows[0].phone,
        dateOfBirth: user.rows[0].date_of_birth,
        driverLicense: user.rows[0].driver_license_number,
        driverLicenseIssueDate: user.rows[0].driver_license_issue_date,
        driverLicenseExpiry: user.rows[0].driver_license_expiry_date,
        address: user.rows[0].address,
        passportNumber: user.rows[0].passport_number,
        avatarUrl: user.rows[0].avatar_url,
        isVerified: user.rows[0].is_verified,
        isActive: user.rows[0].is_active
      }
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера при получении профиля',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Обновление профиля
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      driverLicense,
      driverLicenseIssueDate,
      driverLicenseExpiry,
      address,
      passportNumber
    } = req.body;

    console.log('✏️ Обновление профиля для пользователя:', userId);
    console.log('📦 Данные:', req.body);

    // Валидация обязательных полей
    if (!firstName?.trim()) {
      return res.status(400).json({ error: 'Имя обязательно для заполнения' });
    }
    if (!lastName?.trim()) {
      return res.status(400).json({ error: 'Фамилия обязательна для заполнения' });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ error: 'Телефон обязателен для заполнения' });
    }

    const updatedUser = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone = $3, date_of_birth = $4,
           driver_license_number = $5, driver_license_issue_date = $6, 
           driver_license_expiry_date = $7, address = $8, passport_number = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING id, email, first_name, last_name, phone, date_of_birth,
                 driver_license_number, driver_license_issue_date, 
                 driver_license_expiry_date, address, passport_number`,
      [
        firstName.trim(), 
        lastName.trim(), 
        phone.trim(), 
        dateOfBirth || null, 
        driverLicense?.trim() || null, 
        driverLicenseIssueDate || null, 
        driverLicenseExpiry || null, 
        address?.trim() || null, 
        passportNumber?.trim() || null, 
        userId
      ]
    );

    console.log('✅ Профиль успешно обновлен');

    res.json({
      message: 'Профиль успешно обновлен',
      user: {
        id: updatedUser.rows[0].id,
        email: updatedUser.rows[0].email,
        firstName: updatedUser.rows[0].first_name,
        lastName: updatedUser.rows[0].last_name,
        phone: updatedUser.rows[0].phone,
        dateOfBirth: updatedUser.rows[0].date_of_birth,
        driverLicense: updatedUser.rows[0].driver_license_number,
        driverLicenseIssueDate: updatedUser.rows[0].driver_license_issue_date,
        driverLicenseExpiry: updatedUser.rows[0].driver_license_expiry_date,
        address: updatedUser.rows[0].address,
        passportNumber: updatedUser.rows[0].passport_number
      }
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    
    // Детальная ошибка для отладки
    let errorMessage = 'Ошибка сервера при обновлении профиля';
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      errorMessage = 'Ошибка базы данных: отсутствуют необходимые колонки';
      console.log('❌ Отсутствуют колонки в БД. Выполни SQL для добавления колонки.');
    }

    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/cars - получение списка автомобилей с главными фотографиями
app.get('/api/cars', async (req, res) => {
  try {
    const { search, transmission, fuel_type, car_class } = req.query;
    
    console.log('🔍 GET /api/cars с параметрами:', { search, transmission, fuel_type, car_class });
    
    let query = `
      SELECT 
        c.id, c.brand, c.model, c.year, c.transmission, c.fuel_type, 
        c.seats, c.doors, c.daily_price, c.color, c.engine_capacity,
        c.horsepower, c.fuel_consumption, c.description, c.is_available,
        c.car_class, c.license_plate, c.vin, c.category, c.address,
        cp.photo_url as main_photo_url
      FROM cars c
      LEFT JOIN car_photos cp ON c.id = cp.car_id AND cp.is_main = true
      WHERE c.is_available = true
    `;
    const params = [];

    if (search) {
      query += ` AND (c.brand ILIKE $${params.length + 1} OR c.model ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (transmission) {
      query += ` AND c.transmission = $${params.length + 1}`;
      params.push(transmission);
    }

    if (fuel_type) {
      query += ` AND c.fuel_type = $${params.length + 1}`;
      params.push(fuel_type);
    }

    // ДОБАВИЛ ФИЛЬТРАЦИЮ ПО КЛАССУ
    if (car_class) {
      query += ` AND c.car_class = $${params.length + 1}`;
      params.push(car_class);
    }

    query += ' ORDER BY c.daily_price ASC';

    console.log('📊 SQL запрос:', query);
    console.log('📊 Параметры:', params);

    const result = await pool.query(query, params);
    
    console.log('✅ Найдено машин:', result.rows.length);
    
    // ДЕБАГ: выведи классы найденных машин
    if (car_class) {
      console.log('🎯 Фильтр по классу активен:', car_class);
      console.log('🚗 Найденные автомобили:');
      result.rows.forEach(car => {
        console.log(`   - ${car.brand} ${car.model} (${car.year}) - класс: ${car.car_class}`);
      });
    }
    
    res.json({
      cars: result.rows
    });

  } catch (error) {
    console.error('❌ Get cars error:', error);
    res.status(500).json({ error: 'Ошибка загрузки автомобилей' });
  }
});

// Обнови GET /api/cars/:id чтобы получать все данные
app.get('/api/cars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        id, brand, model, year, transmission, fuel_type, 
        seats, doors, daily_price, color, engine_capacity,
        horsepower, fuel_consumption, description, is_available,
        license_plate, vin, category, address, owner_id
      FROM cars 
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }

    res.json({
      car: result.rows[0]
    });

  } catch (error) {
    console.error('Get car error:', error);
    res.status(500).json({ error: 'Ошибка загрузки данных автомобиля' });
  }
});

// POST /api/cars - добавление нового автомобиля
app.post('/api/cars', authenticateToken, async (req, res) => {
  try {
    const {
      brand, model, year, license_plate, vin, color, category,
      seats, doors, fuel_type, transmission, fuel_consumption,
      engine_capacity, horsepower, description, daily_price, address,
      car_class = 'Эконом' // ДОБАВИЛ ПОЛЕ КЛАССА
    } = req.body;

    console.log('Добавление автомобиля:', req.body);
    console.log('Класс автомобиля:', car_class); // Логирование класса

    const result = await pool.query(
      `INSERT INTO cars (
        owner_id, brand, model, year, license_plate, vin, color, category,
        seats, doors, fuel_type, transmission, fuel_consumption,
        engine_capacity, horsepower, description, daily_price, address, 
        car_class, is_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, true)
      RETURNING *`,
      [
        req.userId, brand, model, year, license_plate, vin, color, category,
        seats, doors, fuel_type, transmission, fuel_consumption,
        engine_capacity, horsepower, description, daily_price, address,
        car_class // ДОБАВИЛ ЗДЕСЬ
      ]
    );

    console.log('Автомобиль добавлен:', result.rows[0].id);
    console.log('Класс сохранен в БД:', result.rows[0].car_class); // Проверка

    res.status(201).json({
      message: 'Автомобиль успешно добавлен',
      car: result.rows[0]
    });

  } catch (error) {
    console.error('Add car error:', error);
    
    // Детализация ошибки для отладки
    if (error.message.includes('car_class')) {
      console.error('❌ ОШИБКА В ДАННЫХ: Поле car_class не существует в таблице cars');
      console.error('❌ Выполни SQL: ALTER TABLE cars ADD COLUMN car_class VARCHAR(20) DEFAULT \'Эконом\';');
      
      return res.status(500).json({ 
        error: 'Ошибка базы данных. Поле "car_class" отсутствует. Обратитесь к администратору.' 
      });
    }
    
    res.status(500).json({ error: 'Ошибка добавления автомобиля' });
  }
});

// POST /api/cars/:id/photos - загрузка фотографий автомобиля
app.post('/api/cars/:id/photos', authenticateToken, upload.array('photos', 10), async (req, res) => {
  try {
    const carId = req.params.id;
    const files = req.files;

    console.log('Загрузка фото для автомобиля:', carId);
    console.log('Файлы:', files);

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Нет файлов для загрузки' });
    }

    // Проверяем что автомобиль принадлежит пользователю
    const carCheck = await pool.query(
      'SELECT owner_id FROM cars WHERE id = $1',
      [carId]
    );

    if (carCheck.rows.length === 0) {
      // Удаляем загруженные файлы если автомобиль не найден
      files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }

    if (carCheck.rows[0].owner_id !== req.userId) {
      // Удаляем загруженные файлы если нет доступа
      files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(403).json({ error: 'Нет доступа к этому автомобилю' });
    }

    // Сохраняем фотографии в БД
    const photoPromises = files.map((file, index) => {
      const isMain = req.body.is_main && req.body.is_main[index] === 'true';
      const displayOrder = req.body.display_order ? parseInt(req.body.display_order[index]) || index : index;

      return pool.query(
        `INSERT INTO car_photos (car_id, photo_url, is_main, display_order)
         VALUES ($1, $2, $3, $4)`,
        [carId, `/uploads/cars/${file.filename}`, isMain, displayOrder]
      );
    });

    await Promise.all(photoPromises);

    console.log('Фотографии успешно загружены:', files.length);

    res.json({
      message: 'Фотографии успешно загружены',
      count: files.length
    });

  } catch (error) {
    console.error('Upload photos error:', error);
    
    // Удаляем загруженные файлы при ошибке
    if (req.files) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
    
    res.status(500).json({ error: 'Ошибка загрузки фотографий' });
  }
});

// GET /api/cars/:id/photos - получение фотографий автомобиля
app.get('/api/cars/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT id, car_id, photo_url, is_main, display_order
       FROM car_photos 
       WHERE car_id = $1 
       ORDER BY is_main DESC, display_order ASC`,
      [id]
    );

    res.json({
      photos: result.rows
    });

  } catch (error) {
    console.error('Get car photos error:', error);
    res.status(500).json({ error: 'Ошибка загрузки фотографий' });
  }
});

// ИСПРАВЛЕННЫЙ РОУТ ДЛЯ БРОНИРОВАНИЙ АВТОМОБИЛЯ
// GET /api/cars/:id/bookings - получить бронирования автомобиля
app.get('/api/cars/:id/bookings', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📅 Бронирования авто', id + ':');
    
    const result = await pool.query(
      `SELECT 
        id,
        car_id,
        renter_id,
        start_date,
        end_date,
        total_days,
        total_price,
        status,
        payment_status,
        created_at
       FROM bookings 
       WHERE car_id = $1 
       AND status IN ('confirmed', 'active', 'paid', 'pending')
       ORDER BY start_date ASC`,
      [id]
    );
    
    console.log(`✅ Найдено: ${result.rows.length} бронирований`);
    
    // Компактное логирование
    if (result.rows.length > 0) {
      result.rows.forEach(booking => {
        const start = new Date(booking.start_date).toISOString().split('T')[0];
        const end = new Date(booking.end_date).toISOString().split('T')[0];
        console.log(`   📌 #${booking.id} [${booking.status}]: ${start} - ${end}`);
      });
    }
    
    res.json({ 
      success: true,
      bookings: result.rows 
    });
  } catch (error) {
    console.error('❌ Ошибка загрузки бронирований:', error);
    res.status(500).json({ 
      success: false,
      error: 'Ошибка загрузки бронирований' 
    });
  }
});

// POST /api/bookings - создать новое бронирование
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const {
      car_id,
      start_date,
      end_date,
      total_days,
      total_price,
      payment_intent_id
    } = req.body;

    const renter_id = req.userId;

    console.log('🆕 Создание бронирования:', {
      car_id,
      renter_id,
      start_date,
      end_date,
      total_days,
      total_price
    });

    // Проверяем доступность дат
    const existingBookings = await pool.query(
      `SELECT id FROM bookings 
       WHERE car_id = $1 
       AND status IN ('confirmed', 'active', 'pending')
       AND (
         (start_date <= $2 AND end_date >= $2) OR
         (start_date <= $3 AND end_date >= $3) OR
         (start_date >= $2 AND end_date <= $3)
       )`,
      [car_id, start_date, end_date]
    );

    if (existingBookings.rows.length > 0) {
      console.log('❌ Дата занята, найдены конфликтующие бронирования');
      return res.status(400).json({
        success: false,
        error: 'Выбранные даты уже заняты'
      });
    }

    // Проверяем что автомобиль существует и доступен
    const carCheck = await pool.query(
      'SELECT id, is_available FROM cars WHERE id = $1',
      [car_id]
    );

    if (carCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Автомобиль не найден'
      });
    }

    if (!carCheck.rows[0].is_available) {
      return res.status(400).json({
        success: false,
        error: 'Автомобиль недоступен для аренды'
      });
    }

    // Создаем бронирование
    const newBooking = await pool.query(
      `INSERT INTO bookings (
        car_id,
        renter_id,
        start_date,
        end_date,
        total_days,
        total_price,
        status,
        payment_status,
        payment_intent_id
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'pending', $7)
      RETURNING *`,
      [car_id, renter_id, start_date, end_date, total_days, total_price, payment_intent_id]
    );

    console.log('✅ Бронирование создано, ID:', newBooking.rows[0].id);

    res.status(201).json({
      success: true,
      booking: newBooking.rows[0]
    });
  } catch (error) {
    console.error('❌ Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка создания бронирования'
    });
  }
});

// GET /api/bookings/my - получить бронирования текущего пользователя
app.get('/api/bookings/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log('📋 Получение бронирований пользователя:', userId);
    
    const result = await pool.query(
    `SELECT 
      b.*,
      c.brand,
      c.model,
      c.year,
      c.color,
      c.daily_price,
      c.license_plate,
      c.vin,
      c.category,
      c.seats,
      c.doors,
      c.fuel_type,
      c.transmission,
      c.engine_capacity,
      c.horsepower,
      c.address,
      u.email as renter_email,
      u.phone as renter_phone
    FROM bookings b
    LEFT JOIN cars c ON b.car_id = c.id
    LEFT JOIN users u ON b.renter_id = u.id
    WHERE b.renter_id = $1
    ORDER BY b.created_at DESC`,
    [userId]
  );
    
    console.log('✅ Найдено бронирований пользователя:', result.rows.length);
    
    res.json({
      success: true,
      bookings: result.rows
    });
  } catch (error) {
    console.error('❌ Get user bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки бронирований'
    });
  }
});

// GET /api/bookings/:id - получить конкретное бронирование
app.get('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    console.log('📄 Получение бронирования:', id, 'для пользователя:', userId);
    
    const result = await pool.query(
      `SELECT 
        b.*,
        c.brand,
        c.model,
        c.color,
        c.daily_price,
        c.license_plate,
        c.fuel_type,
        c.transmission,
        c.seats,
        c.address,
        c.car_class,
        u.email as renter_email,
        u.phone as renter_phone
       FROM bookings b
       LEFT JOIN cars c ON b.car_id = c.id
       LEFT JOIN users u ON b.renter_id = u.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Бронирование не найдено'
      });
    }

    // Проверяем что пользователь имеет доступ к этому бронированию
    const booking = result.rows[0];
    if (booking.renter_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Нет доступа к этому бронированию'
      });
    }
    
    res.json({
      success: true,
      booking: booking
    });
  } catch (error) {
    console.error('❌ Get booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки бронирования'
    });
  }
});

// PUT /api/bookings/:id/confirm - подтвердить оплату бронирования
app.put('/api/bookings/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    console.log('✅ Подтверждение бронирования:', id);
    
    // Проверяем что бронирование принадлежит пользователю
    const bookingCheck = await pool.query(
      'SELECT renter_id FROM bookings WHERE id = $1',
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Бронирование не найдено'
      });
    }

    if (bookingCheck.rows[0].renter_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Нет доступа к этому бронированию'
      });
    }

    const updatedBooking = await pool.query(
      `UPDATE bookings 
       SET status = 'confirmed', 
           payment_status = 'paid',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    console.log('✅ Бронирование подтверждено');

    res.json({
      success: true,
      booking: updatedBooking.rows[0]
    });
  } catch (error) {
    console.error('❌ Confirm booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка подтверждения бронирования'
    });
  }
});

// PUT /api/bookings/:id/cancel - отменить бронирование
app.put('/api/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { cancellation_reason } = req.body;
    
    console.log('❌ Отмена бронирования:', id);
    
    // Проверяем что бронирование принадлежит пользователю
    const bookingCheck = await pool.query(
      'SELECT renter_id FROM bookings WHERE id = $1',
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Бронирование не найдено'
      });
    }

    if (bookingCheck.rows[0].renter_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Нет доступа к этому бронированию'
      });
    }

    const updatedBooking = await pool.query(
      `UPDATE bookings 
       SET status = 'cancelled', 
           cancellation_reason = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id, cancellation_reason]
    );

    console.log('✅ Бронирование отменено');

    res.json({
      success: true,
      booking: updatedBooking.rows[0]
    });
  } catch (error) {
    console.error('❌ Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка отмены бронирования'
    });
  }
});

// GET /api/bookings/car/:carId - получить бронирования автомобиля (для владельца)
app.get('/api/bookings/car/:carId', authenticateToken, async (req, res) => {
  try {
    const { carId } = req.params;
    const userId = req.userId;
    
    console.log('🚗 Получение бронирований автомобиля:', carId, 'для владельца:', userId);
    
    // Проверяем что автомобиль принадлежит пользователю
    const carCheck = await pool.query(
      'SELECT owner_id FROM cars WHERE id = $1',
      [carId]
    );

    if (carCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Автомобиль не найден'
      });
    }

    if (carCheck.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Нет доступа к бронированиям этого автомобиля'
      });
    }

    const result = await pool.query(
      `SELECT 
        b.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
       FROM bookings b
       LEFT JOIN users u ON b.renter_id = u.id
       WHERE b.car_id = $1
       ORDER BY b.created_at DESC`,
      [carId]
    );
    
    console.log('✅ Найдено бронирований автомобиля:', result.rows.length);
    
    res.json({
      success: true,
      bookings: result.rows
    });
  } catch (error) {
    console.error('❌ Get car bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки бронирований автомобиля'
    });
  }
});

// GET /api/contracts/booking/:bookingId/download - скачать договор в PDF
app.get('/api/contracts/booking/:bookingId/download', async (req, res) => {
  console.log('📄 Генерация профессионального PDF договора...');
  
  try {
    const { bookingId } = req.params;
    
    if (!bookingId || isNaN(bookingId)) {
      return res.status(400).send('Некорректный ID бронирования');
    }
    
    // Получаем ВСЕ данные о бронировании
    const result = await pool.query(
      `SELECT 
        b.*,
        c.brand,
        c.model,
        c.year,
        c.license_plate,
        c.vin,
        c.color,
        c.category,
        c.daily_price,
        c.address as car_address,
        c.car_class,
        c.seats,
        c.doors,
        c.fuel_type,
        c.transmission,
        c.engine_capacity,
        c.horsepower,
        c.fuel_consumption,
        c.description,
        ou.id as owner_id,
        ou.first_name as owner_first_name,
        ou.last_name as owner_last_name,
        ou.phone as owner_phone,
        ou.passport_number as owner_passport,
        ou.address as owner_address,
        ou.email as owner_email,
        ou.date_of_birth as owner_birth_date,
        ou.driver_license_number as owner_license,
        ru.id as renter_id,
        ru.first_name as renter_first_name,
        ru.last_name as renter_last_name,
        ru.phone as renter_phone,
        ru.email as renter_email,
        ru.passport_number as renter_passport,
        ru.address as renter_address,
        ru.date_of_birth as renter_birth_date,
        ru.driver_license_number as renter_license
       FROM bookings b
       LEFT JOIN cars c ON b.car_id = c.id
       LEFT JOIN users ou ON c.owner_id = ou.id
       LEFT JOIN users ru ON b.renter_id = ru.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Бронирование не найдено');
    }

    const data = result.rows[0];
    
    // Функции форматирования
    const formatDateFull = (dateString) => {
      if (!dateString) return 'не указана';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      } catch (e) {
        return 'не указана';
      }
    };

    const formatDateShort = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
      } catch (e) {
        return '';
      }
    };

    // Расчет возраста
    const calculateAge = (birthDate) => {
      if (!birthDate) return null;
      try {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      } catch {
        return null;
      }
    };

    // Номер договора
    const contractNumber = `Д-${bookingId}-${new Date().getFullYear()}`;
    const fileName = `dogovor_${bookingId}.pdf`;
    
    // Путь к шрифту
    const fontPath = path.join(__dirname, 'fonts', 'DejaVuSans.ttf');
    
    // Создаем PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Договор аренды № ${contractNumber}`,
        Author: 'RentTogether',
        Subject: 'Договор аренды транспортного средства',
        Keywords: 'аренда, автомобиль, договор'
      }
    });
    
    // Используем шрифт
    doc.font(fontPath);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    doc.pipe(res);
    
    // ========== ПРОФЕССИОНАЛЬНЫЙ ДОГОВОР ==========
    
    // ШАПКА С ЛОГОТИПОМ (место для лого)
    doc.fontSize(10)
       .fillColor('#2c3e50')
       .text('RENTTOGETHER', 50, 40, { align: 'right' });
    
    doc.fontSize(8)
       .fillColor('#7f8c8d')
       .text('Сервис аренды автомобилей', 50, 55, { align: 'right' });
    
    // НОМЕР ДОГОВОРА И ДАТА
    doc.fontSize(14)
       .fillColor('#000')
       .text(`Договор № ${contractNumber}`, 50, 90, { align: 'center', underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .fillColor('#444')
       .text('аренды транспортного средства', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(11)
       .fillColor('#666')
       .text(`г. Челябинск, ${formatDateFull(new Date())}`, { align: 'center' });
    
    doc.moveDown(2);
    
    // РАЗДЕЛ 1: ПРЕАМБУЛА
    doc.fontSize(11)
       .fillColor('#333')
       .text('Настоящий договор составлен в соответствии с Гражданским кодексом Российской Федерации и регулирует отношения между сторонами по аренде транспортного средства.');
    
    doc.moveDown(1.5);
    
    // РАЗДЕЛ 2: СТОРОНЫ ДОГОВОРА
    doc.fontSize(13)
       .fillColor('#000')
       .text('1. СТОРОНЫ ДОГОВОРА', { underline: true, bold: true });
    
    doc.moveDown(0.5);
    
    // АРЕНДОДАТЕЛЬ
    const ownerAge = calculateAge(data.owner_birth_date);
    doc.fontSize(11)
       .fillColor('#000')
       .text('1.1. Арендодатель (Собственник транспортного средства):', { bold: true });
    
    doc.fontSize(11)
       .fillColor('#333')
       .text(`ФИО: ${data.owner_first_name || ''} ${data.owner_last_name || ''}`);
    doc.text(`Дата рождения: ${formatDateFull(data.owner_birth_date)} ${ownerAge ? `(${ownerAge} лет)` : ''}`);
    doc.text(`Паспорт: ${data.owner_passport || '__________'}, выдан: ________________`);
    doc.text(`Адрес регистрации: ${data.owner_address || '________________'}`);
    doc.text(`Контактный телефон: ${data.owner_phone || '__________'}`);
    doc.text(`Электронная почта: ${data.owner_email || '__________'}`);
    if (data.owner_license) {
      doc.text(`Водительское удостоверение: ${data.owner_license}`);
    }
    
    doc.moveDown(1);
    
    // АРЕНДАТОР
    const renterAge = calculateAge(data.renter_birth_date);
    doc.fontSize(11)
       .fillColor('#000')
       .text('1.2. Арендатор:', { bold: true });
    
    doc.fontSize(11)
       .fillColor('#333')
       .text(`ФИО: ${data.renter_first_name || ''} ${data.renter_last_name || ''}`);
    doc.text(`Дата рождения: ${formatDateFull(data.renter_birth_date)} ${renterAge ? `(${renterAge} лет)` : ''}`);
    doc.text(`Паспорт: ${data.renter_passport || '__________'}, выдан: ________________`);
    doc.text(`Адрес регистрации: ${data.renter_address || '________________'}`);
    doc.text(`Контактный телефон: ${data.renter_phone || '__________'}`);
    doc.text(`Электронная почта: ${data.renter_email || '__________'}`);
    if (data.renter_license) {
      doc.text(`Водительское удостоверение: ${data.renter_license}`);
    }
    
    // РАЗДЕЛ 3: ПРЕДМЕТ ДОГОВОРА
    doc.moveDown(1.5);
    doc.fontSize(13)
       .fillColor('#000')
       .text('2. ПРЕДМЕТ ДОГОВОРА', { underline: true, bold: true });
    
    doc.moveDown(0.5);
    doc.fontSize(11)
       .fillColor('#333')
       .text('2.1. Арендодатель передает, а Арендатор принимает во временное владение и пользование следующее транспортное средство:');
    
    doc.moveDown(0.5);
    
    // ТАБЛИЦА ХАРАКТЕРИСТИК АВТО
    const carStartY = doc.y;
    
    // Заголовок таблицы
    doc.rect(50, carStartY, 500, 25)
       .fill('#2c3e50')
       .stroke('#2c3e50');
    
    doc.fontSize(11)
       .fillColor('#fff')
       .text('ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ ТРАНСПОРТНОГО СРЕДСТВА', 50, carStartY + 8, { width: 500, align: 'center' });
    
    // Строки таблицы
    const carSpecs = [
      ['Марка, модель', `${data.brand || ''} ${data.model || ''}`],
      ['Год выпуска', data.year || ''],
      ['Гос. номер', data.license_plate || ''],
      ['VIN', data.vin || ''],
      ['Цвет', data.color || ''],
      ['Класс', data.car_class || ''],
      ['КПП', data.transmission || ''],
      ['Топливо', data.fuel_type || ''],
      ['Объем', data.engine_capacity ? `${data.engine_capacity} л` : ''],
      ['Мощность', data.horsepower ? `${data.horsepower} л.с.` : '']
    ];
    
    let rowY = carStartY + 30;
    
    carSpecs.forEach((spec, index) => {
      // Чередование цветов строк
      if (index % 2 === 0) {
        doc.rect(50, rowY, 500, 20)
           .fill('#f8f9fa')
           .stroke('#dee2e6');
      }
      
      doc.fontSize(10)
         .fillColor('#333')
         .text(spec[0], 55, rowY + 5, { width: 300 })
         .text(spec[1], 355, rowY + 5, { width: 190, align: 'right' });
      
      rowY += 20;
    });
    
    doc.y = rowY + 10;
    
    // СБРОСЬ X НА ЛЕВЫЙ КРАЙ ДО ЗАГОЛОВКА
    doc.x = 50;
    
    // РАЗДЕЛ 4: СРОК АРЕНДЫ И УСЛОВИЯ
    doc.moveDown(1);
    doc.fontSize(13)
       .fillColor('#000')
       .text('3. СРОК АРЕНДЫ И УСЛОВИЯ ПЕРЕДАЧИ', { align: 'left', underline: true, bold: true });
    
    doc.moveDown(0.5);
    
    // ВАЖНО: Сбрось позицию X после таблицы
    doc.x = 50; // ← ДОБАВЬ ЭТУ СТРОКУ!
    
    doc.fontSize(11)
       .fillColor('#333');
    
    const startDate = formatDateFull(data.start_date);
    const endDate = formatDateFull(data.end_date);
    
    doc.text(`3.1. Срок аренды транспортного средства составляет с ${startDate} по ${endDate} включительно.`);
    doc.text(`3.2. Продолжительность аренды: ${data.total_days || 0} (${data.total_days === 1 ? 'один' : data.total_days} ${data.total_days === 1 ? 'день' : data.total_days < 5 ? 'дня' : 'дней'}) календарных.`);
    doc.text(`3.3. Место получения транспортного средства: ${data.car_address || 'адрес согласовывается сторонами дополнительно'}.`);
    doc.text(`3.4. Место возврата транспортного средства: ${data.car_address || 'адрес согласовывается сторонами дополнительно'}.`);
    doc.text('3.5. Арендодатель обязуется передать транспортное средство в технически исправном состоянии, с полным баком топлива, чистое снаружи и внутри.');
    doc.text('3.6. Арендатор обязуется вернуть транспортное средство в том же состоянии, с учетом нормального износа.');
    
    // РАЗДЕЛ 5: СТОИМОСТЬ АРЕНДЫ И ПОРЯДОК РАСЧЕТОВ
    doc.moveDown(1.5);
    doc.fontSize(13)
       .fillColor('#000')
       .text('4. СТОИМОСТЬ АРЕНДЫ И ПОРЯДОК РАСЧЕТОВ', { underline: true, bold: true });
    
    doc.moveDown(0.5);
    doc.fontSize(11)
       .fillColor('#333');
    
    doc.text(`4.1. Стоимость аренды транспортного средства составляет ${data.daily_price || 0} (${numToWords(data.daily_price || 0)}) рублей за одни сутки.`);
    doc.text(`4.2. Общая стоимость аренды составляет ${data.total_price || 0} (${numToWords(data.total_price || 0)}) рублей.`);
    doc.text('4.3. Оплата произведена Арендатором в полном объеме посредством сервиса RentTogether до момента передачи транспортного средства.');
    doc.text('4.4. В стоимость аренды включено:');
    doc.text('   - Страхование КАСКО (от угона и повреждений);', { indent: 20 });
    doc.text('   - Страхование ОСАГО (гражданская ответственность);', { indent: 20 });
    doc.text('   - Техническое обслуживание транспортного средства.', { indent: 20 });
    doc.text('4.5. Дополнительные расходы, не включенные в стоимость аренды:');
    doc.text('   - Топливо;', { indent: 20 });
    doc.text('   - Мойка транспортного средства;', { indent: 20 });
    doc.text('   - Штрафы за нарушение Правил дорожного движения.', { indent: 20 });
    
    // РАЗДЕЛ 6: ПРАВА И ОБЯЗАННОСТИ СТОРОН
    doc.moveDown(1.5);
    doc.fontSize(13)
       .fillColor('#000')
       .text('5. ПРАВА И ОБЯЗАННОСТИ СТОРОН', { underline: true, bold: true });
    
    doc.moveDown(0.5);
    doc.fontSize(11)
       .fillColor('#333');
    
    doc.text('5.1. Арендодатель имеет право:');
    doc.text('   - Проверять состояние транспортного средства в любое время;', { indent: 20 });
    doc.text('   - Требовать досрочного расторжения договора при нарушении условий.', { indent: 20 });
    
    doc.moveDown(0.5);
    doc.text('5.2. Арендодатель обязан:');
    doc.text('   - Передать транспортное средство в исправном состоянии;', { indent: 20 });
    doc.text('   - Обеспечить страховку транспортного средства.', { indent: 20 });
    
    doc.moveDown(0.5);
    doc.text('5.3. Арендатор имеет право:');
    doc.text('   - Использовать транспортное средство по назначению;', { indent: 20 });
    doc.text('   - Требовать возврата денежных средств при неисправности ТС.', { indent: 20 });
    
    doc.moveDown(0.5);
    doc.text('5.4. Арендатор обязан:');
    doc.text('   - Соблюдать Правила дорожного движения;', { indent: 20 });
    doc.text('   - Не передавать транспортное средство третьим лицам;', { indent: 20 });
    doc.text('   - Не использовать транспортное средство в коммерческих целях;', { indent: 20 });
    doc.text('   - Не участвовать в гонках и соревнованиях;', { indent: 20 });
    doc.text('   - Не буксировать другие транспортные средства;', { indent: 20 });
    doc.text('   - Немедленно сообщать о любой неисправности.', { indent: 20 });
    
    // РАЗДЕЛ 7: ОТВЕТСТВЕННОСТЬ СТОРОН
    doc.moveDown(1.5);
    doc.fontSize(13)
       .fillColor('#000')
       .text('6. ОТВЕТСТВЕННОСТЬ СТОРОН', { underline: true, bold: true });
    
    doc.moveDown(0.5);
    doc.fontSize(11)
       .fillColor('#333');
    
    doc.text('6.1. Арендатор несет полную материальную ответственность за:');
    doc.text('   - Ущерб, причиненный транспортному средству;', { indent: 20 });
    doc.text('   - Штрафы за нарушение ПДД, совершенные в период аренды;', { indent: 20 });
    doc.text('   - Угон транспортного средства по вине Арендатора.', { indent: 20 });
    
    doc.text('6.2. В случае аварии Арендатор обязан:');
    doc.text('   - Немедленно сообщить в ГИБДД и страховую компанию;', { indent: 20 });
    doc.text('   - Сообщить Арендодателю в течение 1 часа;', { indent: 20 });
    doc.text('   - Оформить все необходимые документы.', { indent: 20 });
    
    // РАЗДЕЛ 8: ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ
    doc.moveDown(1.5);
    doc.fontSize(13)
       .fillColor('#000')
       .text('7. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ', { underline: true, bold: true });
    
    doc.moveDown(0.5);
    doc.fontSize(11)
       .fillColor('#333');
    
    doc.text('7.1. Настоящий договор вступает в силу с момента его подписания сторонами.');
    doc.text('7.2. Все споры и разногласия решаются путем переговоров.');
    doc.text('7.3. При невозможности урегулирования споров они передаются в суд по месту нахождения Арендодателя.');
    doc.text('7.4. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу, по одному для каждой из сторон.');
    doc.text('7.5. Все изменения и дополнения к договору действительны только в письменной форме.');
    
    // ПОДПИСИ СТОРОН
    doc.moveDown(3);
    
    const signatureY = doc.y;
    
    // Подпись Арендодателя
    doc.fontSize(11)
       .fillColor('#000')
       .text('АРЕНДОДАТЕЛЬ:', 50, signatureY);
    
    doc.rect(50, signatureY + 20, 200, 1)
       .fill('#000')
       .stroke('#000');
    
    doc.fontSize(10)
       .fillColor('#666')
       .text(`(${data.owner_first_name || ''} ${data.owner_last_name || ''})`, 50, signatureY + 25, { width: 200, align: 'center' });
    
    doc.fontSize(9)
       .text('подпись', 50, signatureY + 40, { width: 200, align: 'center' });
    
    // Подпись Арендатора
    doc.fontSize(11)
       .fillColor('#000')
       .text('АРЕНДАТОР:', 350, signatureY);
    
    doc.rect(350, signatureY + 20, 200, 1)
       .fill('#000')
       .stroke('#000');
    
    doc.fontSize(10)
       .fillColor('#666')
       .text(`(${data.renter_first_name || ''} ${data.renter_last_name || ''})`, 350, signatureY + 25, { width: 200, align: 'center' });
    
    doc.fontSize(9)
       .text('подпись', 350, signatureY + 40, { width: 200, align: 'center' });
    
    // ФУТЕР
    doc.moveDown(5);
    doc.fontSize(8)
       .fillColor('#999')
       .text('Договор сгенерирован автоматически через сервис аренды автомобилей RentTogether', { align: 'center' });
    doc.text(`Время генерации: ${new Date().toLocaleString('ru-RU')}`, { align: 'center' });
    doc.text('Для проверки подлинности договора обратитесь в службу поддержки: support@renttogether.ru', { align: 'center' });
    
    // Завершаем PDF
    doc.end();
    
    console.log(`✅ Профессиональный договор № ${contractNumber} успешно сгенерирован`);
    
  } catch (error) {
    console.error('❌ Ошибка генерации PDF:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial; padding: 20px;">
          <h2 style="color: red;">Ошибка генерации договора</h2>
          <p><strong>${error.message}</strong></p>
        </body>
      </html>
    `);
  }
});

// Функция для преобразования чисел в слова (для сумм прописью)
function numToWords(num) {
  const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  
  if (num === 0) return 'ноль';
  
  let result = '';
  const numStr = num.toString().padStart(6, '0');
  
  // Обрабатываем тысячи
  const thousands = parseInt(numStr.substring(0, 3));
  if (thousands > 0) {
    if (thousands >= 100) {
      result += hundreds[Math.floor(thousands / 100)] + ' ';
    }
    const tensPart = thousands % 100;
    if (tensPart >= 20) {
      result += tens[Math.floor(tensPart / 10)] + ' ';
      if (tensPart % 10 > 0) {
        result += units[tensPart % 10] + ' ';
      }
    } else if (tensPart >= 10) {
      result += teens[tensPart - 10] + ' ';
    } else if (tensPart > 0) {
      result += units[tensPart] + ' ';
    }
    
    // Добавляем правильное окончание для тысяч
    const lastDigit = thousands % 10;
    const lastTwoDigits = thousands % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      result += 'тысяч ';
    } else if (lastDigit === 1) {
      result += 'тысяча ';
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      result += 'тысячи ';
    } else {
      result += 'тысяч ';
    }
  }
  
  // Обрабатываем единицы
  const ones = parseInt(numStr.substring(3, 6));
  if (ones >= 100) {
    result += hundreds[Math.floor(ones / 100)] + ' ';
  }
  
  const onesTens = ones % 100;
  if (onesTens >= 20) {
    result += tens[Math.floor(onesTens / 10)] + ' ';
    if (onesTens % 10 > 0) {
      result += units[onesTens % 10] + ' ';
    }
  } else if (onesTens >= 10) {
    result += teens[onesTens - 10] + ' ';
  } else if (onesTens > 0) {
    result += units[onesTens] + ' ';
  }
  
  // Добавляем "рублей" с правильным окончанием
  const lastDigit = ones % 10;
  const lastTwoDigits = ones % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    result += 'рублей';
  } else if (lastDigit === 1) {
    result += 'рубль';
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    result += 'рубля';
  } else {
    result += 'рублей';
  }
  
  return result.trim();
}

// Простой тестовый роут для проверки
app.get('/api/test/db', async (req, res) => {
  try {
    // Проверка подключения
    const dbResult = await pool.query('SELECT NOW() as time');
    
    // Проверка таблиц
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    // Проверка bookings
    let bookingsCount = 0;
    const hasBookings = tablesResult.rows.some(t => t.table_name === 'bookings');
    
    if (hasBookings) {
      const bookingsResult = await pool.query('SELECT COUNT(*) as count FROM bookings');
      bookingsCount = bookingsResult.rows[0].count;
    }
    
    res.json({
      success: true,
      database_time: dbResult.rows[0].time,
      tables: tablesResult.rows.map(t => t.table_name),
      has_bookings_table: hasBookings,
      bookings_count: bookingsCount
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Обработка ошибок multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Файл слишком большой. Максимальный размер 5MB.' });
    }
  }
  next(error);
});

// Добавьте этот роут перед app.listen
app.get('/api/test/simple', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, car_id, renter_id FROM bookings ORDER BY id');
    
    let html = `<html><body style="padding:20px;"><h1>Бронирования в БД</h1>`;
    html += `<p>Всего: ${result.rows.length}</p>`;
    html += `<ul>`;
    
    result.rows.forEach(row => {
      html += `<li>Бронирование #${row.id} (авто: ${row.car_id}, арендатор: ${row.renter_id}) 
                - <a href="/api/contracts/booking/${row.id}/download" target="_blank">Скачать договор</a></li>`;
    });
    
    html += `</ul></body></html>`;
    res.send(html);
    
  } catch (error) {
    res.send(`<html><body>Ошибка: ${error.message}</body></html>`);
  }
});

// Получить пользователя по ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, avatar_url 
       FROM users WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Ошибка загрузки пользователя' });
  }
});

// ========== НАЧАЛО КОДА ЧАТА ==========
// Получить список чатов пользователя
app.get('/api/chats', authenticateToken, async (req, res) => {
  const userId = req.userId;  // ← ИСПРАВЛЕНО
  try {
    const result = await pool.query(
      `SELECT c.*, 
        u.id as other_user_id, u.first_name, u.last_name,
        (SELECT message FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM chats c
      JOIN users u ON (u.id = c.user1_id OR u.id = c.user2_id)
      WHERE (c.user1_id = $1 OR c.user2_id = $1) AND u.id != $1
      ORDER BY last_message_time DESC NULLS LAST`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки чатов' });
  }
});

// Получить сообщения чата
app.get('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const userId = req.userId;  // ← ИСПРАВЛЕНО
  try {
    const chatCheck = await pool.query(
      'SELECT id FROM chats WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [chatId, userId]
    );
    if (chatCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Нет доступа к этому чату' });
    }
    
    const result = await pool.query(
      `SELECT m.*, u.first_name, u.last_name 
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.chat_id = $1 
       ORDER BY m.created_at ASC`,
      [chatId]
    );
    
    await pool.query(
      `UPDATE messages SET is_read = true 
       WHERE chat_id = $1 AND sender_id != $2 AND is_read = false`,
      [chatId, userId]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки сообщений' });
  }
});

// Отправить сообщение
app.post('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { message } = req.body;
  const userId = req.userId;  // ← ИСПРАВЛЕНО
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Сообщение не может быть пустым' });
  }
  
  try {
    const chatCheck = await pool.query(
      'SELECT id FROM chats WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [chatId, userId]
    );
    if (chatCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Нет доступа к этому чату' });
    }
    
    const result = await pool.query(
      `INSERT INTO messages (chat_id, sender_id, message) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [chatId, userId, message.trim()]
    );
    
    await pool.query(
      'UPDATE chats SET updated_at = NOW() WHERE id = $1',
      [chatId]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

// Создать новый чат
app.post('/api/chats', authenticateToken, async (req, res) => {
  const { otherUserId } = req.body;
  const userId = req.userId;  // ← ИСПРАВЛЕНО
  
  if (userId === otherUserId) {
    return res.status(400).json({ error: 'Нельзя создать чат с самим собой' });
  }
  
  try {
    let existingChat = await pool.query(
      'SELECT id FROM chats WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
      [userId, otherUserId]
    );
    
    if (existingChat.rows.length > 0) {
      return res.json({ chatId: existingChat.rows[0].id });
    }
    
    const result = await pool.query(
      'INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING id',
      [userId, otherUserId]
    );
    
    res.json({ chatId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания чата' });
  }
});
// ========== КОНЕЦ КОДА ЧАТА ==========

// ========== ДОБАВЛЕНА КАРТА МАРШРУТОВ ПЕРЕД ЗАПУСКОМ СЕРВЕРА ==========
app.use(expressRouterDiagram({
  generateWeb: true,
  webRoute: 'express-routes'
}));

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🗺️  Карта маршрутов доступна по адресу: http://localhost:${PORT}/express-routes`);
});