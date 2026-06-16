require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const loanRoutes = require('./routes/loans');
const customerRoutes = require('./routes/customers');
const systemRoutes = require('./routes/system');

const app = express();

// Connect to MongoDB
connectDB();

// CORS — allow the GitHub Pages frontend and localhost for dev
const allowedOrigins = [
  'https://backup-alt.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/system', systemRoutes);

// Health check endpoint (useful for Render)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Vehicle Finance API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
