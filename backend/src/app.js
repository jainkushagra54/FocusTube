import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import progressRoutes from './routes/progress.routes.js';
import AppError from './utils/AppError.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

app.use(
    cors(
    {
        origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    }
))

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'FocusTube backend is healthy and running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);


app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});


app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});


process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
