import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requestLogger } from './middleware/logger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();

// Security & Parsing Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use(requestLogger);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ShelfLife API is running',
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// 404 & Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
