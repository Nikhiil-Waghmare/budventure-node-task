import express from 'express';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express Server!' });
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from API' });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/echo', (req, res) => {
  const { text } = req.body;
  res.json({ echo: text });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Express server running on http://localhost:${PORT}`);
});