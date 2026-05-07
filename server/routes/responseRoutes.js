import express from 'express';
import { submitResponse, getAnalytics } from '../controllers/responseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/submit', authMiddleware, roleMiddleware(['student']), submitResponse);
router.get('/analytics', authMiddleware, roleMiddleware(['admin', 'hod']), getAnalytics);

export default router;
