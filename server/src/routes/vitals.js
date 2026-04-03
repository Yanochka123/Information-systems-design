const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { device_id, limit = 50 } = req.query;
    let query = `
      SELECT vs.*, d.name as device_name, d.type as device_type
      FROM vital_signs vs
      JOIN devices d ON d.id = vs.device_id
    `;
    const params = [];
    if (device_id) {
      params.push(device_id);
      query += ` WHERE vs.device_id = $${params.length}`;
    }
    params.push(parseInt(limit));
    query += ` ORDER BY vs.recorded_at DESC LIMIT $${params.length}`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) AS total_readings,
        ROUND(AVG(heart_rate)) AS avg_heart_rate,
        MAX(heart_rate) AS max_heart_rate,
        MIN(heart_rate) AS min_heart_rate,
        ROUND(AVG(steps)) AS avg_steps,
        SUM(steps) AS total_steps,
        ROUND(AVG(sleep_hours)::numeric, 2) AS avg_sleep_hours,
        ROUND(AVG(spo2)::numeric, 1) AS avg_spo2,
        MAX(recorded_at) AS last_reading
      FROM vital_signs
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (vs.device_id)
        vs.*, d.name as device_name, d.type as device_type
      FROM vital_signs vs
      JOIN devices d ON d.id = vs.device_id
      ORDER BY vs.device_id, vs.recorded_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trends', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        date_trunc('hour', recorded_at) AS hour,
        ROUND(AVG(heart_rate)) AS avg_heart_rate,
        ROUND(AVG(steps)) AS avg_steps,
        ROUND(AVG(sleep_hours)::numeric, 2) AS avg_sleep,
        ROUND(AVG(spo2)::numeric, 1) AS avg_spo2
      FROM vital_signs
      WHERE recorded_at >= NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { device_id, heart_rate, steps, sleep_hours, sleep_quality, spo2 } = req.body;
  if (!device_id) return res.status(400).json({ error: 'device_id is required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO vital_signs (device_id, heart_rate, steps, sleep_hours, sleep_quality, spo2)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [device_id, heart_rate || null, steps || null, sleep_hours || null, sleep_quality || null, spo2 || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulate', async (req, res) => {
  try {
    const { rows: devices } = await pool.query("SELECT id FROM devices WHERE status = 'active'");
    if (!devices.length) return res.status(400).json({ error: 'No active devices' });

    const readings = [];
    for (const device of devices) {
      const heart_rate = Math.floor(Math.random() * (100 - 55) + 55);
      const steps = Math.floor(Math.random() * 5000);
      const sleep_hours = +(Math.random() * (9 - 5) + 5).toFixed(1);
      const sleep_quality = ['poor', 'fair', 'good', 'excellent'][Math.floor(Math.random() * 4)];
      const spo2 = Math.floor(Math.random() * (100 - 94) + 94);

      const { rows } = await pool.query(
        `INSERT INTO vital_signs (device_id, heart_rate, steps, sleep_hours, sleep_quality, spo2)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [device.id, heart_rate, steps, sleep_hours, sleep_quality, spo2]
      );
      readings.push(rows[0]);
    }
    res.status(201).json({ simulated: readings.length, readings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
