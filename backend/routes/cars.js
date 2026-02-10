const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/cars - получить список автомобилей с фильтрами
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT 
        c.*,
        cp.photo_url as main_photo_url
      FROM cars c
      LEFT JOIN car_photos cp ON c.id = cp.car_id AND cp.is_main = true
      WHERE c.is_available = true
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Фильтр по поиску (марка или модель)
    if (req.query.search) {
      query += ` AND (LOWER(c.brand) LIKE LOWER($${paramIndex}) OR LOWER(c.model) LIKE LOWER($${paramIndex}))`;
      queryParams.push(`%${req.query.search}%`);
      paramIndex++;
    }

    // Фильтр по трансмиссии
    if (req.query.transmission) {
      query += ` AND c.transmission = $${paramIndex}`;
      queryParams.push(req.query.transmission);
      paramIndex++;
    }

    // Фильтр по типу топлива
    if (req.query.fuel_type) {
      query += ` AND c.fuel_type = $${paramIndex}`;
      queryParams.push(req.query.fuel_type);
      paramIndex++;
    }

    // ФИЛЬТР ПО КЛАССУ АВТОМОБИЛЯ
    if (req.query.car_class) {
      query += ` AND c.car_class = $${paramIndex}`;
      queryParams.push(req.query.car_class);
      paramIndex++;
    }

    // Сортировка
    query += ` ORDER BY c.created_at DESC`;

    console.log('🔍 Query:', query);
    console.log('🔍 Params:', queryParams);

    const result = await db.query(query, queryParams);
    
    res.json({
      success: true,
      cars: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('❌ Ошибка загрузки автомобилей:', error);
    res.status(500).json({ 
      success: false,
      error: 'Ошибка загрузки автомобилей' 
    });
  }
});

// GET /api/cars/:id/bookings - получить бронирования автомобиля
router.get('/:id/bookings', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔴🔴🔴 ЗАПРОС НА БРОНИРОВАНИЯ ДЛЯ АВТО:', id);
    console.log('🔴🔴🔴 ФАЙЛ: cars.js, СТРОКА: ~7');
    
    const bookings = await db.query(
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
    
    console.log('📅🔴🔴🔴 Найдено бронирований:', bookings.rows.length);
    
    if (bookings.rows.length > 0) {
      console.log('📋 Список бронирований:');
      bookings.rows.forEach(booking => {
        console.log(`  ID: ${booking.id}, Статус: "${booking.status}", Даты: ${booking.start_date} - ${booking.end_date}`);
      });
    }
    
    res.json({ 
      success: true,
      bookings: bookings.rows 
    });
  } catch (error) {
    console.error('❌ Ошибка загрузки бронирований:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// GET /api/cars/:id/photos - получить фотографии автомобиля
router.get('/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    
    const photos = await db.query(
      `SELECT 
        id,
        car_id,
        photo_url,
        is_main,
        created_at
       FROM car_photos 
       WHERE car_id = $1 
       ORDER BY is_main DESC, created_at ASC`,
      [id]
    );
    
    res.json({ 
      success: true,
      photos: photos.rows 
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ДЕБАГ-ЭНДПОИНТ: получить ВСЕ бронирования (включая cancelled)
router.get('/:id/all-bookings-debug', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🐛 DEBUG: Ищем ВСЕ бронирования для car_id:', id);
    
    const bookings = await db.query(
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
       ORDER BY start_date ASC`,
      [id]
    );
    
    console.log('🐛 DEBUG: Всего бронирований в БД:', bookings.rows.length);
    
    bookings.rows.forEach(booking => {
      console.log(`  🐛 ID: ${booking.id}, Статус: "${booking.status}", Даты: ${booking.start_date} - ${booking.end_date}`);
    });
    
    res.json({ 
      success: true,
      bookings: bookings.rows,
      debug: true
    });
  } catch (error) {
    console.error('❌ DEBUG Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;