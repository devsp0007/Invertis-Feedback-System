import { User, Department, Enrollment } from '../db.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

function serialize(doc) {
  if (!doc) return doc;
  if (typeof doc.toJSON === 'function') {
    try { return doc.toJSON(); } catch (e) { return { ...doc }; }
  }
  return { ...doc };
}

// ── GET /api/users/students
export const getStudentsList = async (req, res) => {
  try {
    const { role, department_id } = req.user;
    let query = { role: 'student' };

    if (role === 'hod') {
      query.department_id = department_id;
    } else if (role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to user list' });
    }

    const students = await User.find(query);
    const result = [];

    for (const student of students) {
      const dept = await Department.findById(student.department_id);
      const enrollmentCount = await Enrollment.countDocuments({ student_id: student._id });
      
      result.push({
        id: student._id,
        name: student.name,
        email: student.email,
        college_id: student.college_id,
        department_name: dept ? dept.name : 'Unknown',
        enrollment_count: enrollmentCount,
        created_at: student.created_at || new Date()
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── GET /api/users/all [Admin only - for HOD/Admin management]
export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const users = await User.find();
    const result = [];

    for (const u of users) {
      const dept = await Department.findById(u.department_id);
      result.push({
        ...serialize(u),
        department_name: dept ? dept.name : 'N/A'
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── PATCH /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, college_id, department_id } = req.body;
    
    // Check permissions
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (req.user.role !== 'admin') {
      if (req.user.role === 'hod' && targetUser.department_id?.toString() !== req.user.department_id) {
        return res.status(403).json({ message: 'Cannot edit students outside your department' });
      }
      if (req.user.role === 'student' && req.user.id !== id) {
        return res.status(403).json({ message: 'Cannot edit other users' });
      }
    }

    const updated = await User.findByIdAndUpdate(id, { 
      name, email, college_id, department_id 
    }, { new: true });

    return res.status(200).json(serialize(updated));
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (req.user.role !== 'admin') {
      if (req.user.role === 'hod' && targetUser.department_id?.toString() !== req.user.department_id) {
        return res.status(403).json({ message: 'Cannot delete students outside your department' });
      }
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await User.findByIdAndDelete(id);
    // Cleanup enrollments
    await Enrollment.deleteMany({ student_id: id });
    
    return res.status(200).json({ message: 'User and related data deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ── POST /api/users
export const createUser = async (req, res) => {
  try {
    const { name, email, college_id, department_id, password, role } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Validation
    if (!name || !college_id || !password) {
      return res.status(400).json({ message: 'Name, College ID, and Password are required' });
    }

    // For HODs, enforce department
    const finalDeptId = req.user.role === 'hod' ? req.user.department_id : department_id;
    const finalRole = role || 'student';

    // Check for existing user
    const existing = await User.findOne({ $or: [{ email }, { college_id }] });
    if (existing) {
      return res.status(400).json({ message: 'User with this Email or College ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: email || `${college_id}@invertis.edu.in`,
      college_id,
      department_id: finalDeptId,
      password: hashedPassword,
      role: finalRole
    });

    return res.status(201).json(serialize(newUser));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
