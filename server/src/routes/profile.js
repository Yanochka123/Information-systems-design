const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM user_profile ORDER BY id LIMIT 1');
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  const {
    full_name, email, date_of_birth, gender,
    height_cm, weight_kg, avatar_url, bio,
    goal_steps, goal_sleep_hours, goal_heart_rate_max
  } = req.body;

  try {
    const { rows: existing } = await pool.query('SELECT id FROM user_profile LIMIT 1');

    if (!existing.length) {
      const { rows } = await pool.query(
        `INSERT INTO user_profile (full_name, email, date_of_birth, gender, height_cm, weight_kg, avatar_url, bio, goal_steps, goal_sleep_hours, goal_heart_rate_max, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING *`,
        [full_name, email, date_of_birth || null, gender, height_cm || null, weight_kg || null, avatar_url || null, bio, goal_steps || 10000, goal_sleep_hours || 8.0, goal_heart_rate_max || 100]
      );
      return res.json(rows[0]);
    }

    const { rows } = await pool.query(
      `UPDATE user_profile SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        date_of_birth = COALESCE($3, date_of_birth),
        gender = COALESCE($4, gender),
        height_cm = COALESCE($5, height_cm),
        weight_kg = COALESCE($6, weight_kg),
        avatar_url = COALESCE($7, avatar_url),
        bio = COALESCE($8, bio),
        goal_steps = COALESCE($9, goal_steps),
        goal_sleep_hours = COALESCE($10, goal_sleep_hours),
        goal_heart_rate_max = COALESCE($11, goal_heart_rate_max),
        updated_at = NOW()
       WHERE id = $12 RETURNING *`,
      [full_name, email, date_of_birth || null, gender, height_cm || null, weight_kg || null, avatar_url || null, bio, goal_steps, goal_sleep_hours, goal_heart_rate_max, existing[0].id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
