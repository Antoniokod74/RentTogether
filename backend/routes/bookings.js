const express = require('express');
const router = express.Router();
const db = require('../db'); // путь к твоему подключению БД

// GET /api/bookings - получить все бронирования (для админки)
router.get('/', async (req, res) => {
  try {
    const bookings = await db.query(
      `SELECT 
        b.*,
        c.brand,
        c.model,
        c.license_plate,
        u.email as renter_email
       FROM bookings b
       LEFT JOIN cars c ON b.car_id = c.id
       LEFT JOIN users u ON b.renter_id = u.id
       ORDER BY b.created_at DESC`
    );
    
    res.json({ 
      success: true,
      bookings: bookings.rows 
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// GET /api/bookings/user/:userId - получить бронирования пользователя
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const bookings = await db.query(
      `SELECT 
        b.*,
        c.brand,
        c.model,
        c.color,
        c.daily_price,
        c.license_plate,
        c.fuel_type,
        c.transmission
       FROM bookings b
       LEFT JOIN cars c ON b.car_id = c.id
       WHERE b.renter_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );
    
    res.json({ 
      success: true,
      bookings: bookings.rows 
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// GET /api/bookings/:id - получить конкретное бронирование
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await db.query(
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
        u.email as renter_email,
        u.phone as renter_phone
       FROM bookings b
       LEFT JOIN cars c ON b.car_id = c.id
       LEFT JOIN users u ON b.renter_id = u.id
       WHERE b.id = $1`,
      [id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Бронирование не найдено'
      });
    }
    
    res.json({ 
      success: true,
      booking: booking.rows[0]
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// POST /api/bookings - создать новое бронирование
router.post('/', async (req, res) => {
  try {
    const {
      car_id,
      renter_id,
      start_date,
      end_date,
      total_days,
      total_price,
      payment_intent_id
    } = req.body;

    // Проверяем доступность дат
    const existingBookings = await db.query(
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
      return res.status(400).json({
        success: false,
        error: 'Выбранные даты уже заняты'
      });
    }

    // Создаем бронирование
    const newBooking = await db.query(
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

    res.status(201).json({
      success: true,
      booking: newBooking.rows[0]
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/bookings/:id/confirm - подтвердить оплату бронирования
router.put('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedBooking = await db.query(
      `UPDATE bookings 
       SET status = 'confirmed', 
           payment_status = 'paid',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (updatedBooking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Бронирование не найдено'
      });
    }

    res.json({
      success: true,
      booking: updatedBooking.rows[0]
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/bookings/:id/cancel - отменить бронирование
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;
    
    const updatedBooking = await db.query(
      `UPDATE bookings 
       SET status = 'cancelled', 
           cancellation_reason = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id, cancellation_reason]
    );

    if (updatedBooking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Бронирование не найдено'
      });
    }

    res.json({
      success: true,
      booking: updatedBooking.rows[0]
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/bookings/:id - удалить бронирование
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedBooking = await db.query(
      'DELETE FROM bookings WHERE id = $1 RETURNING *',
      [id]
    );

    if (deletedBooking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Бронирование не найдено'
      });
    }

    res.json({
      success: true,
      message: 'Бронирование удалено'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;