import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'renttogether',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  // Фиксим ECONNRESET
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false,
  // Важные настройки для стабильности
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Убираем старую проверку которая вызывает ошибку
// Вместо этого добавляем обработчики событий

pool.on('connect', () => {
  console.log('✅ PostgreSQL подключен');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка PostgreSQL:', err.message);
});

// Простая проверка без падения приложения
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('🕒 Время БД:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.log('⚠️ БД временно недоступна, продолжаем работу...');
  }
};

// Запускаем проверку без блокировки
setTimeout(testConnection, 1000);

export default pool;