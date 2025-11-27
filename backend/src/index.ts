import dotenv from 'dotenv';
import app from './app';

dotenv.config();

// Import sequelize using require to avoid TypeScript errors with JS models
const db = require('./database/models');
const { sequelize } = db;

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Test Sequelize database connection
    await sequelize.authenticate();
    console.log('✅ Sequelize database connection established successfully');

    // Optionally sync models in development (be careful with this in production)
    if (process.env.NODE_ENV === 'development') {
      // await sequelize.sync({ alter: true }); // Uncomment only if needed
      console.log('📋 Using existing database schema (migrations recommended)');
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Database connection error. Please check your .env configuration');
    process.exit(1);
  }
}

startServer();
