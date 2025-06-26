const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

require('dotenv').config();

const sequelize = require('./config/database');
const recommendationRoutes = require('./route/recommendations');

require('./models/User');
require('./models/Product');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/recommendations', recommendationRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'vector-microservice'
  });
});


app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message 
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    
    // Sync database (in production, use migrations instead)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized.');
    }
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

startServer();