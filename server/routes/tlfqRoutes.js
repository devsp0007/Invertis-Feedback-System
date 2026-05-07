import express from 'express';
import {
  getDepartments, createDepartment, deleteDepartment,
  getCourses, createCourse, deleteCourse,
  getAllFaculty, createFaculty, deleteFaculty,
  getCourseEvaluations, getSpecificEvaluation,
  createTlfq, getStudents, createEnrollment, getAdminStats
} from '../controllers/tlfqController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ── Public (authenticated) endpoints
router.get('/courses', authMiddleware, getCourses);
router.get('/departments', authMiddleware, getDepartments);
router.get('/courses/:courseId/evaluations', authMiddleware, getCourseEvaluations);
router.get('/courses/:courseId/evaluation/:tlfqId', authMiddleware, getSpecificEvaluation);

// ── HOD + Admin shared
router.get('/faculty', authMiddleware, roleMiddleware(['admin', 'hod']), getAllFaculty);
router.get('/stats', authMiddleware, roleMiddleware(['admin']), getAdminStats);

// ── Admin-only management endpoints
router.post('/departments', authMiddleware, roleMiddleware(['admin']), createDepartment);
router.delete('/departments/:id', authMiddleware, roleMiddleware(['admin']), deleteDepartment);
router.post('/courses', authMiddleware, roleMiddleware(['admin']), createCourse);
router.delete('/courses/:id', authMiddleware, roleMiddleware(['admin']), deleteCourse);
router.post('/faculty', authMiddleware, roleMiddleware(['admin']), createFaculty);
router.delete('/faculty/:id', authMiddleware, roleMiddleware(['admin']), deleteFaculty);
router.post('/', authMiddleware, roleMiddleware(['admin']), createTlfq);
router.get('/students', authMiddleware, roleMiddleware(['admin']), getStudents);
router.post('/enrollments', authMiddleware, roleMiddleware(['admin']), createEnrollment);

export default router;
