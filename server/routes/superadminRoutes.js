import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { createHod, createCoordinator, getStaff, updateUser, deleteUser } from '../controllers/superadminController.js';

const router = express.Router();
const guard = [authenticate, authorize('super_admin')];

router.post('/hods',              guard, createHod);
router.post('/coordinators',      guard, createCoordinator);
router.get('/staff',              guard, getStaff);
router.put('/users/:id',          guard, updateUser);
router.delete('/users/:id',       guard, deleteUser);

export default router;
