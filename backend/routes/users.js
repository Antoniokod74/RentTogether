const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/users/profile - получить профиль
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('Получение профиля для пользователя:', req.user.id);
    
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
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
        passportNumber: user.passportNumber,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении профиля' });
  }
});

// PUT /api/users/profile - обновить профиль
router.put('/profile', auth, async (req, res) => {
  try {
    console.log('Обновление профиля для пользователя:', req.user.id);
    console.log('Данные:', req.body);

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
    if (!firstName || !lastName || !phone) {
      return res.status(400).json({ error: 'Имя, фамилия и телефон обязательны' });
    }

    // Находим пользователя
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Обновляем поля
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    user.dateOfBirth = dateOfBirth;
    user.driverLicense = driverLicense;
    user.driverLicenseIssueDate = driverLicenseIssueDate;
    user.driverLicenseExpiry = driverLicenseExpiry;
    user.address = address;
    user.passportNumber = passportNumber;

    // Сохраняем
    await user.save();

    // Возвращаем обновленного пользователя без пароля
    const updatedUser = await User.findById(req.user.id).select('-password');

    res.json({
      message: 'Профиль успешно обновлен',
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        dateOfBirth: updatedUser.dateOfBirth,
        driverLicense: updatedUser.driverLicense,
        driverLicenseIssueDate: updatedUser.driverLicenseIssueDate,
        driverLicenseExpiry: updatedUser.driverLicenseExpiry,
        address: updatedUser.address,
        passportNumber: updatedUser.passportNumber
      }
    });

  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    
    // Более детальные ошибки
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Ошибка валидации данных' });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Неверный ID пользователя' });
    }
    
    res.status(500).json({ error: 'Ошибка сервера при обновлении профиля' });
  }
});

module.exports = router;