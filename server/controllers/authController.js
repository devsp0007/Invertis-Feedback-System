import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../db.js';

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'College ID/Email and password are required' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { college_id: identifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Role-based Identifier Enforcement
    if (user.role === 'student' && user.college_id !== identifier) {
      return res.status(401).json({ message: 'Students must use their College ID to log in' });
    }
    if ((user.role === 'admin' || user.role === 'hod') && user.email !== identifier) {
      return res.status(401).json({ message: 'Staff must use their Email to log in' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, department_id: user.department_id?.toString() || null },
      SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id?.toString() || null
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id?.toString() || null
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
