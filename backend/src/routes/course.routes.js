import express from 'express';
import { importCourse, getMyCourses, getCourseById } from '../controllers/course.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all routes in this router
router.use(protect);

router.post('/import', importCourse);
router.get('/', getMyCourses);
router.get('/:id', getCourseById);

export default router;
