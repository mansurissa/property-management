import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import fs from 'fs';
import router from './routes';

const app = express();
app.use(cors());

// Ensure public directories exist
const publicDir = './public';
const uploadsDir = './public/uploads';

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Renta API'
  });
});

// Routes
app.use('/api/v1', router);

// Not found endpoint
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Cannot find ${req.originalUrl} on this server`
  });
});

// Global error handler - MUST be after all other middleware and routes
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('❌ Error caught by global handler:', err);

    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';
    const errors = err.errors || err.validationErrors || [];

    // Always return JSON, never HTML
    res.status(statusCode).json({
      status: 'error',
      message: message,
      errors: errors.length > 0 ? errors : undefined,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
);

export default app;
