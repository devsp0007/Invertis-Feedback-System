import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Section } from '../db.js';
import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

function makeToken(user) {
  return jwt.sign(
    { id: user.id || user._id.toString(), role: user.role, department_id: user.department_id?.toString() || null },
    SECRET,
    { expiresIn: '1d' }
  );
}

function safeUser(user) {
  return {
    id: user.id || user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    department_id: user.department_id?.toString() || null,
    section_id: user.section_id?.toString() || null,
    student_id: user.student_id || null,
    unique_feedback_id: user.unique_feedback_id || null,
    points: user.points || 0,
    batch: user.batch || null,
    semester: user.semester || null,
  };
}

// ── Step 1: Check student ID → returns status ──────────────────────────────
export const checkStudentId = async (req, res) => {
  try {
    const { student_id } = req.body;
    if (!student_id) return res.status(400).json({ message: 'Student ID is required.' });

    const user = await User.findOne({ student_id: student_id.trim().toUpperCase() }).lean();
    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Student ID not found. Please contact your coordinator.' });
    }

    return res.status(200).json({
      status: user.status,          // "pending" or "active"
      name: user.name,
      student_id: user.student_id
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── Step 2: Complete registration (pending → active) ───────────────────────
export const completeRegistration = async (req, res) => {
  try {
    const { student_id, email, password } = req.body;
    if (!student_id || !email || !password) {
      return res.status(400).json({ message: 'Student ID, email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const user = await User.findOne({ student_id: student_id.trim().toUpperCase() });
    if (!user) return res.status(404).json({ message: 'Student ID not found.' });
    if (user.status === 'active') {
      return res.status(400).json({ message: 'Account already activated. Please login normally.' });
    }

    const emailExists = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: user._id } });
    if (emailExists) return res.status(400).json({ message: 'Email is already in use.' });

    const hashed = await bcrypt.hash(password, 10);
    const fbId = 'ANO-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const updated = await User.findByIdAndUpdate(user._id, {
      email: email.trim().toLowerCase(),
      password: hashed,
      status: 'active',
      unique_feedback_id: fbId
    }, { new: true });

    const token = makeToken(updated);
    return res.status(200).json({ token, user: safeUser(updated) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── Normal login (email or student_id + password) ──────────────────────────
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ message: 'Identifier and password are required.' });

    const isEmail = identifier.includes('@');
    let user;

    if (isEmail) {
      user = await User.findOne({ email: identifier.trim().toLowerCase() });
      if (!user) return res.status(401).json({ message: 'No account found with this email.' });
    } else {
      // Student ID login
      user = await User.findOne({ student_id: identifier.trim().toUpperCase() });
      if (!user) return res.status(404).json({ message: 'Student ID not found. Contact your coordinator.' });
      if (user.status === 'pending') {
        return res.status(403).json({ message: 'ACCOUNT_PENDING', student_id: user.student_id, name: user.name });
      }
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'ACCOUNT_PENDING', student_id: user.student_id, name: user.name });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Incorrect password.' });

    const token = makeToken(user);
    return res.status(200).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── Change Password (allowed for all roles except student — coordinator handles that) ──
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'current_password and new_password are required.' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isValid = await bcrypt.compare(current_password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Current password is incorrect.' });

    user.password = await bcrypt.hash(new_password, 10);
    await user.save();
    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
