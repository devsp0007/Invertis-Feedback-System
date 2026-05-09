import { User } from '../db.js';
import bcrypt from 'bcryptjs';

// ── Create Super Admin (only Supreme Authority can do this) ──────────────
export const createSuperAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password required' });
    }
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({ name, email: email.toLowerCase(), password: hashed, role: 'super_admin', status: 'active' });
    return res.status(201).json({ id: admin._id.toString(), name: admin.name, email: admin.email, role: 'super_admin' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Email already in use.' });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── Create HOD ─────────────────────────────────────────────────────────────
export const createHod = async (req, res) => {
  try {
    const { name, email, password, department_id } = req.body;
    if (!name || !email || !password || !department_id) {
      return res.status(400).json({ message: 'name, email, password, department_id required' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const hod = await User.create({ name, email: email.toLowerCase(), password: hashed, role: 'hod', department_id, status: 'active' });
    return res.status(201).json({ id: hod._id.toString(), name: hod.name, email: hod.email, role: 'hod' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Email already in use.' });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── Create Coordinator ─────────────────────────────────────────────────────
export const createCoordinator = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password required' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const coord = await User.create({ name, email: email.toLowerCase(), password: hashed, role: 'coordinator', status: 'active' });
    return res.status(201).json({ id: coord._id.toString(), name: coord.name, email: coord.email, role: 'coordinator' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Email already in use.' });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── Get all staff ──────────────────────────────────────────────────────────
export const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['hod', 'coordinator'] } }).lean();
    return res.json(staff.map(s => ({ id: s._id.toString(), name: s.name, email: s.email, role: s.role, department_id: s.department_id?.toString() || null })));
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── Update user ────────────────────────────────────────────────────────────
export const updateUser = async (req, res) => {
  try {
    const { name, email, password, department_id } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (department_id) updates.department_id = department_id;
    if (password) updates.password = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ id: user._id.toString(), name: user.name, email: user.email, role: user.role });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};

// ── Delete user ────────────────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: 'User deleted' });
  } catch { return res.status(500).json({ message: 'Internal Server Error' }); }
};
