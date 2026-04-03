const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { device_id } = req.query;
    let query = `
      SELECT r.*, d.name as device_name
      FROM recommendations r
      JOIN devices d ON d.id = r.device_id
    `;
    const params = [];
    if (device_id) {
      params.push(device_id);
      query += ` WHERE r.device_id = $${params.length}`;
    }
    query += ' ORDER BY r.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { rows: latest } = await pool.query(`
      SELECT DISTINCT ON (vs.device_id)
        vs.*, d.name as device_name
      FROM vital_signs vs
      JOIN devices d ON d.id = vs.device_id
      WHERE d.status = 'active'
      ORDER BY vs.device_id, vs.recorded_at DESC
    `);

    const newRecs = [];
    for (const reading of latest) {
      if (reading.heart_rate && reading.heart_rate > 90) {
        const { rows } = await pool.query(
          `INSERT INTO recommendations (device_id, category, message, priority)
           VALUES ($1, 'heart', 'Elevated heart rate detected at ${reading.heart_rate} bpm. Consider rest or a breathing exercise.', 'high') RETURNING *`,
          [reading.device_id]
        );
        newRecs.push(rows[0]);
      }
      if (reading.steps && reading.steps < 3000) {
        const { rows } = await pool.query(
          `INSERT INTO recommendations (device_id, category, message, priority)
           VALUES ($1, 'activity', 'Low activity today (${reading.steps} steps). Try a short 15-minute walk!', 'normal') RETURNING *`,
          [reading.device_id]
        );
        newRecs.push(rows[0]);
      }
      if (reading.sleep_hours && reading.sleep_hours < 6) {
        const { rows } = await pool.query(
          `INSERT INTO recommendations (device_id, category, message, priority)
           VALUES ($1, 'sleep', 'Less than 6 hours of sleep. Prioritize rest for better recovery and health.', 'high') RETURNING *`,
          [reading.device_id]
        );
        newRecs.push(rows[0]);
      }
    }

    res.status(201).json({ generated: newRecs.length, recommendations: newRecs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
