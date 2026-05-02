import express from 'express';
import { submitResponse, getAnalytics } from '../controllers/responseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, submitResponse);
router.get('/analytics', authMiddleware, roleMiddleware(['admin']), getAnalytics);

export default router;
