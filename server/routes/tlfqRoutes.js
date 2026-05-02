import express from 'express';
import { getCourses, getCourseTlfq, getCourseEvaluations, getSpecificEvaluation, getAllFaculty, createCourse, createFaculty, createTlfq, createQuestion, deleteCourse, deleteFaculty } from '../controllers/tlfqController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/courses', authMiddleware, getCourses);
router.get('/courses/:courseId/evaluation', authMiddleware, getCourseTlfq);
router.get('/courses/:courseId/evaluations', authMiddleware, getCourseEvaluations);
router.get('/courses/:courseId/evaluation/:tlfqId', authMiddleware, getSpecificEvaluation);

// Admin-only endpoints
router.get('/faculty', authMiddleware, roleMiddleware(['admin']), getAllFaculty);
router.post('/courses', authMiddleware, roleMiddleware(['admin']), createCourse);
router.post('/faculty', authMiddleware, roleMiddleware(['admin']), createFaculty);
router.post('/', authMiddleware, roleMiddleware(['admin']), createTlfq);
router.post('/questions', authMiddleware, roleMiddleware(['admin']), createQuestion);
router.delete('/courses/:id', authMiddleware, roleMiddleware(['admin']), deleteCourse);
router.delete('/faculty/:id', authMiddleware, roleMiddleware(['admin']), deleteFaculty);

export default router;

