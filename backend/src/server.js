import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Initialize Database connection and start Express server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`[Server] ShelfLife API server listening on http://localhost:${PORT}`);
  });
};

startServer();
