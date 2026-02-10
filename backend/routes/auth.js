const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/users/profile - получить профиль пользователя
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('🔐 Получение профиля для пользователя:', req.user.id);
    
    // Пользователь уже есть в req.user из middleware auth
    const user = req.user;

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        driverLicense: user.driverLicense || '',
        driverLicenseIssueDate: user.driverLicenseIssueDate || '',
        driverLicenseExpiry: user.driverLicenseExpiry || '',
        address: user.address || '',
        passportNumber: user.passportNumber || '',
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении профиля' });
  }
});

// PUT /api/users/profile - обновить профиль
router.put('/profile', auth, async (req, res) => {
  try {
    console.log('✏️ Обновление профиля для пользователя:', req.user.id);
    console.log('📦 Данные:', req.body);

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

    // Находим пользователя
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Обновляем поля
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.phone = phone.trim();
    
    // Опциональные поля
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (driverLicense) user.driverLicense = driverLicense.trim();
    if (driverLicenseIssueDate) user.driverLicenseIssueDate = driverLicenseIssueDate;
    if (driverLicenseExpiry) user.driverLicenseExpiry = driverLicenseExpiry;
    if (address) user.address = address.trim();
    if (passportNumber) user.passportNumber = passportNumber.trim();

    console.log('💾 Сохранение пользователя...');
    await user.save();
    console.log('✅ Пользователь сохранен успешно');

    // Возвращаем обновленные данные
    res.json({
      message: 'Профиль успешно обновлен',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        driverLicense: user.driverLicense,
        driverLicenseIssueDate: user.driverLicenseIssueDate,
        driverLicenseExpiry: user.driverLicenseExpiry,
        address: user.address,
        passportNumber: user.passportNumber
      }
    });

  } catch (error) {
    console.error('❌ Ошибка обновления профиля:', error);
    
    // Детальные ошибки
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: `Ошибка валидации: ${errors.join(', ')}` });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Неверный ID пользователя' });
    }
    
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;