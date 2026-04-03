const pool = require('./db');

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) DEFAULT 'Health User',
      email VARCHAR(255) DEFAULT 'user@healthnavigator.app',
      date_of_birth DATE,
      gender VARCHAR(50),
      height_cm INTEGER,
      weight_kg NUMERIC(5,1),
      avatar_url TEXT,
      goal_steps INTEGER DEFAULT 10000,
      goal_sleep_hours NUMERIC(3,1) DEFAULT 8.0,
      goal_heart_rate_max INTEGER DEFAULT 100,
      bio TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      model VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      registered_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS vital_signs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
      heart_rate INTEGER,
      steps INTEGER,
      sleep_hours NUMERIC(4,2),
      sleep_quality VARCHAR(50),
      spo2 INTEGER,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
      category VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      priority VARCHAR(50) DEFAULT 'normal',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const { rows } = await pool.query('SELECT COUNT(*) FROM devices');
  if (parseInt(rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO devices (id, name, type, model, status) VALUES
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'My Smartwatch', 'smartwatch', 'HealthBand Pro X', 'active'),
        ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Fitness Tracker', 'fitness_bracelet', 'FitBand Lite', 'active'),
        ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Medical Sensor', 'medical_sensor', 'VitalSense 3000', 'inactive');
    `);

    await pool.query(`
      INSERT INTO vital_signs (device_id, heart_rate, steps, sleep_hours, sleep_quality, spo2, recorded_at) VALUES
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 72, 8420, 7.5, 'good', 98, NOW() - INTERVAL '1 hour'),
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 68, 5100, 6.2, 'fair', 97, NOW() - INTERVAL '2 hours'),
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 85, 12300, 8.0, 'excellent', 99, NOW() - INTERVAL '3 hours'),
        ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 76, 6700, 7.0, 'good', 96, NOW() - INTERVAL '30 minutes'),
        ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 80, 9800, 5.5, 'poor', 95, NOW() - INTERVAL '1 hour'),
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 70, 3200, 7.8, 'good', 98, NOW() - INTERVAL '5 hours'),
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 74, 10500, 8.5, 'excellent', 99, NOW() - INTERVAL '6 hours'),
        ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 88, 4500, 6.8, 'fair', 97, NOW() - INTERVAL '4 hours');
    `);

    await pool.query(`
      INSERT INTO recommendations (device_id, category, message, priority) VALUES
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'activity', 'Great job hitting 8,000+ steps today! Try for 10,000 tomorrow.', 'low'),
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'sleep', 'Your sleep quality is good. Keep a consistent bedtime for best results.', 'normal'),
        ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'heart', 'Elevated resting heart rate detected. Consider a short walk or breathing exercises.', 'high'),
        ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'sleep', 'Only 5.5 hours of sleep detected. Aim for 7-9 hours for optimal health.', 'high');
    `);
  }

  console.log('Database schema initialized and seeded.');
}

module.exports = { initSchema };
