import express from 'express';
import { toggleVideoComplete, updateSchedule } from '../controllers/progress.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all progress routes
router.use(protect);

router.post('/:courseId/complete/:videoYoutubeId', toggleVideoComplete);
router.put('/:courseId/schedule', updateSchedule);

export default router;
