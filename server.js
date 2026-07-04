import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import appointmentRoutes from './routes/appointmentRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend client port 5173, dev server origins, and production URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Root test route
app.get('/', (req, res) => {
  res.json({ message: 'The Golden Tooth Clinic REST API is running successfully.' });
});

// Register routers
app.use('/api/appointments', appointmentRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/contact', contactRoutes);

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`[API] Server is actively running on Port ${PORT}`);
  console.log(`[API] Test endpoint active at http://localhost:${PORT}/`);
});
export default app;
