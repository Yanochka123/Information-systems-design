const express = require('express');
const cors = require('cors');
const { initSchema } = require('./schema');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/devices', require('./routes/devices'));
app.use('/api/vitals', require('./routes/vitals'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/profile', require('./routes/profile'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'HealthNavigator API', version: '1.0.0' });
});

initSchema().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HealthNavigator API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
